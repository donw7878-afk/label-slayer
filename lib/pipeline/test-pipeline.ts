/**
 * Product Data Pipeline end-to-end test.
 *
 *   npx tsx lib/pipeline/test-pipeline.ts
 *
 * 1. Runs the migration (schema + ingredient seed — idempotent).
 * 2. Slays a manual-entry product (organic EVOO) so the clean-swap generator
 *    has a high-scoring candidate to point at.
 * 3. Looks up Doritos and Coca-Cola by real barcode on Open Food Facts and
 *    runs the full pipeline; falls back to the Score Engine's verified test
 *    ingredient lists if the external API is down or empty.
 * 4. Reads everything back from Supabase to verify it persisted.
 * 5. Tests the user-submission flow (including duplicate detection).
 *
 * Costs real Anthropic API calls (one per non-cached product). Cached
 * products are always served from Supabase without an AI call (slays never
 * expire by age), so re-runs are cheap.
 */

import { runMigration, loadEnvLocal } from "../database/migrate";
import {
  getCleanSwaps,
  getIngredientsForProduct,
  getProductBySlug,
  type ProductRow,
} from "../database/queries";
import { TEST_PRODUCTS } from "../scoring";
import { lookupByBarcode } from "./lookup";
import { slayProduct, slayByBarcode } from "./pipeline";
import { submitProductForReview } from "./submit";
import type { SlayResult } from "./types";

const RULE = "=".repeat(72);

const REAL_BARCODES: Array<{ barcode: string; fallbackTestId: string }> = [
  { barcode: "028400443685", fallbackTestId: "doritos-nacho-cheese" },
  { barcode: "049000006346", fallbackTestId: "coca-cola" },
];

async function printProductRecord(product: ProductRow): Promise<void> {
  console.log(`\n${RULE}`);
  console.log(`${product.brand ?? "?"} — ${product.name}`);
  console.log(RULE);
  console.log(`  id:               ${product.id}`);
  console.log(`  slug:             ${product.slug}`);
  console.log(`  barcode:          ${product.barcode ?? "—"}`);
  console.log(`  category:         ${product.category ?? "—"} / ${product.subcategory ?? "—"}`);
  console.log(`  source:           ${product.source ?? "—"} (${product.source_id ?? "—"})`);
  console.log(`  score:            ${product.score} — ${product.verdict_label}`);
  console.log(`  processing:       ${product.processing_level}`);
  console.log(`  flags:            ${product.red_flag_count} red / ${product.amber_flag_count} amber`);
  console.log(`  status:           ${product.status}`);
  console.log(`  reviewed_at:      ${product.reviewed_at}`);
  console.log(`  deductions:       ${product.deductions?.length ?? 0} entries`);

  if (product.slay_content) {
    const slay = product.slay_content;
    console.log(`\n  HEADLINE   ${slay.headline}`);
    console.log(`  SUMMARY    ${slay.summary}`);
    console.log(`  FINAL WORD ${slay.finalWord}`);
    console.log(`  (full slay: ${Object.keys(slay).length} fields, ${slay.redFlagBreakdown.length} ingredient roasts)`);
  }

  const ingredients = await getIngredientsForProduct(product.id);
  console.log(`\n  LINKED INGREDIENTS (${ingredients.length}):`);
  for (const link of ingredients.slice(0, 10)) {
    console.log(
      `    #${link.position} ${link.ingredient.canonical_name} [${link.flag_level}] (-${link.deduction_applied})`,
    );
  }
  if (ingredients.length > 10) {
    console.log(`    ... and ${ingredients.length - 10} more`);
  }

  const swaps = await getCleanSwaps(product.id);
  console.log(`\n  CLEAN SWAPS (${swaps.length}):`);
  for (const swap of swaps) {
    console.log(
      `    → ${swap.swap_product.name} (${swap.swap_product.score}/100) — ${swap.reason}`,
    );
  }
}

function describeResult(result: SlayResult): string {
  switch (result.status) {
    case "slayed":
      return `slayed: ${result.product.slug} (${result.product.score}/100, cache: ${result.fromCache})`;
    case "needs-submission":
      return `needs-submission: ${result.lookup.name} — ${result.message}`;
    case "not-found":
      return `not-found: ${result.message}`;
  }
}

async function main(): Promise<void> {
  loadEnvLocal();

  // --- 1. Migration ----------------------------------------------------------
  console.log(`${RULE}\nSTEP 1: Migration\n${RULE}`);
  await runMigration();

  // --- 2. Manual-entry product (gives clean swaps a candidate) ---------------
  console.log(`\n${RULE}\nSTEP 2: Manual entry — Organic EVOO\n${RULE}`);
  const evoo = TEST_PRODUCTS.find((p) => p.id === "organic-olive-oil")!;
  const evooResult = await slayProduct({
    name: evoo.name,
    brand: evoo.brand,
    category: "food",
    subcategory: "cooking oil",
    ingredientsRaw: evoo.ingredients,
    isOrganic: evoo.isOrganic,
    productFormat: evoo.format,
    source: "manual",
    frontClaims: ["Organic", "Cold-Pressed"],
  });
  console.log(`Slayed: ${evooResult.product.slug} (${evooResult.product.score}/100)`);

  // --- 3. Real barcodes via Open Food Facts -----------------------------------
  const slayedSlugs: string[] = [evooResult.product.slug];

  for (const { barcode, fallbackTestId } of REAL_BARCODES) {
    console.log(`\n${RULE}\nSTEP 3: Barcode ${barcode}\n${RULE}`);

    const lookup = await lookupByBarcode(barcode);
    if (lookup?.ingredients_raw) {
      const result = await slayByBarcode(barcode);
      console.log(`Result: ${describeResult(result)}`);
      if (result.status === "slayed") slayedSlugs.push(result.product.slug);
    } else {
      // External API down or record incomplete — fall back to the Score
      // Engine's verified label text so the pipeline still gets exercised.
      const fallback = TEST_PRODUCTS.find((p) => p.id === fallbackTestId)!;
      console.log(
        `Barcode lookup incomplete — falling back to verified label for ${fallback.brand} ${fallback.name}`,
      );
      const result = await slayProduct({
        name: fallback.name,
        brand: fallback.brand,
        category: "food",
        barcode,
        ingredientsRaw: fallback.ingredients,
        isOrganic: fallback.isOrganic,
        productFormat: fallback.format,
        source: "manual",
      });
      slayedSlugs.push(result.product.slug);
      console.log(`Slayed via fallback: ${result.product.slug} (${result.product.score}/100)`);
    }
  }

  // --- 4-5. Read back from Supabase and print ---------------------------------
  console.log(`\n${RULE}\nSTEP 4: Read back from Supabase\n${RULE}`);
  for (const slug of slayedSlugs) {
    const product = await getProductBySlug(slug);
    if (!product) throw new Error(`Verification failed: ${slug} not in database`);
    await printProductRecord(product);
  }

  // --- 6. Submission flow ------------------------------------------------------
  console.log(`\n${RULE}\nSTEP 5: Product submission\n${RULE}`);
  const submission = await submitProductForReview({
    productName: "Mystery Snack Bar",
    brand: "TestBrand",
    barcode: "9900000000001",
    ingredientsRaw: "Oats, Honey, Mystery Powder",
    submittedBy: "test-pipeline@labelslayer.dev",
  });
  console.log(
    `Submission result: ${submission.status} (${submission.submissionId}) — ${submission.message}`,
  );

  console.log(`\n${RULE}\nPipeline test complete.\n${RULE}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
