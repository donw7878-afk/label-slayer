/**
 * Bulk slay: batch-process USDA Branded Foods by category.
 *
 *   npx tsx lib/pipeline/bulk-slay.ts "Snacks"
 *   npx tsx lib/pipeline/bulk-slay.ts "Snacks" --limit 10
 *   npx tsx lib/pipeline/bulk-slay.ts "Snacks" --auto-publish
 *   npx tsx lib/pipeline/bulk-slay.ts --categories
 *
 * Products save as "pending-review" (admin signs off in the dashboard) unless
 * --auto-publish is set. Runs at most MAX_CONCURRENT pipeline calls at a time
 * with a 1s pause between batches; one product failing never sinks the batch.
 */

import { loadEnvLocal } from "../database/migrate";
import { getProductByBarcode, getProductBySlug } from "../database/queries";
import { barcodeVariants } from "./lookup";
import { cleanProductName } from "./cleanup";
import { productSlug, slayProduct } from "./pipeline";
import { mapUsdaFood, searchUSDA } from "./usda";
import type { ProductLookupResult } from "./types";

const MAX_CONCURRENT = 5;
const BATCH_DELAY_MS = 1000;
const USDA_PAGE_SIZE = 200;

// Rough per-product Anthropic spend: one Sonnet cleanup call (~$0.003) plus
// one Sonnet slay call (~9K input / ~1.2K output ≈ $0.045).
const EST_COST_PER_SLAY_USD = 0.05;

/**
 * Common USDA Branded Food categories (static reference — the FDC API has no
 * category-listing endpoint). Pass any of these as the category argument.
 */
const USDA_CATEGORIES = [
  "Snacks",
  "Cereal",
  "Candy",
  "Cheese",
  "Yogurt",
  "Bread & Muffins",
  "Cookies & Biscuits",
  "Chips, Pretzels & Snacks",
  "Ice Cream & Frozen Yogurt",
  "Pizza",
  "Breakfast Sandwiches, Biscuits & Meals",
  "Frozen Dinners & Entrees",
  "Soda",
  "Sport Drinks",
  "Energy Drinks",
  "Plant Based Water",
  "Juice, Drinks & Ales",
  "Baby Food",
  "Peanut Butter, Jams & Jellies (Shelf Stable)",
  "Pasta by Shape & Type",
  "Sauces, Condiments & Dressings",
  "Crackers & Crispbreads",
  "Popcorn, Peanuts, Seeds & Related Snacks",
  "Chocolate",
  "Granola & Protein Bars",
];

interface BulkResult {
  name: string;
  outcome: "slayed" | "skipped" | "failed";
  score?: number;
  verdictLabel?: string;
  error?: string;
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function alreadyInDatabase(lookup: ProductLookupResult): Promise<boolean> {
  if (lookup.barcode) {
    for (const variant of barcodeVariants(lookup.barcode)) {
      if (await getProductByBarcode(variant)) return true;
    }
  }
  return false;
}

async function processOne(
  lookup: ProductLookupResult,
  saveStatus: "published" | "pending-review",
): Promise<BulkResult> {
  try {
    if (await alreadyInDatabase(lookup)) {
      return { name: lookup.name, outcome: "skipped" };
    }
    if (!lookup.ingredients_raw) {
      return { name: lookup.name, outcome: "failed", error: "no ingredient list" };
    }

    const cleanedName = await cleanProductName(lookup.name, lookup.brand ?? undefined);

    // Second existence check under the cleaned name's slug (barcode-less rows).
    const existing = await getProductBySlug(productSlug(cleanedName, lookup.brand));
    if (existing?.slay_content) {
      return { name: cleanedName, outcome: "skipped" };
    }

    const { product, fromCache } = await slayProduct(
      {
        name: cleanedName,
        nameRaw: lookup.name,
        brand: lookup.brand ?? undefined,
        category: lookup.category ?? undefined,
        subcategory: lookup.subcategory ?? undefined,
        barcode: lookup.barcode ?? undefined,
        ingredientsRaw: lookup.ingredients_raw,
        isOrganic: lookup.isOrganic,
        source: "usda",
        sourceId: lookup.sourceId ?? undefined,
      },
      { saveStatus },
    );

    if (fromCache) return { name: product.name, outcome: "skipped" };
    return {
      name: product.name,
      outcome: "slayed",
      score: product.score ?? undefined,
      verdictLabel: product.verdict_label ?? undefined,
    };
  } catch (err) {
    return {
      name: lookup.name,
      outcome: "failed",
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

function printSummary(results: BulkResult[]): void {
  const slayed = results.filter((r) => r.outcome === "slayed");
  const skipped = results.filter((r) => r.outcome === "skipped");
  const failed = results.filter((r) => r.outcome === "failed");

  const tiers = new Map<string, number>();
  for (const r of slayed) {
    const tier = r.verdictLabel ?? "Unknown";
    tiers.set(tier, (tiers.get(tier) ?? 0) + 1);
  }

  console.log(`\n${"=".repeat(60)}`);
  console.log("BULK SLAY SUMMARY");
  console.log("=".repeat(60));
  console.log(`Total processed: ${slayed.length}`);
  console.log(`Total skipped (already existed): ${skipped.length}`);
  console.log(`Total failed: ${failed.length}`);
  console.log("\nScore distribution:");
  if (tiers.size === 0) console.log("  (nothing slayed)");
  for (const [tier, count] of [...tiers.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${tier}: ${count}`);
  }
  if (failed.length > 0) {
    console.log("\nFailures:");
    for (const r of failed) console.log(`  ${r.name}: ${r.error}`);
  }
  console.log(
    `\nEstimated API cost: ~$${(slayed.length * EST_COST_PER_SLAY_USD).toFixed(2)} ` +
      `(${slayed.length} slays × ~$${EST_COST_PER_SLAY_USD.toFixed(2)})`,
  );
}

async function main(): Promise<void> {
  loadEnvLocal();

  const args = process.argv.slice(2);
  if (args.includes("--categories")) {
    console.log("Common USDA Branded Food categories:\n");
    for (const category of USDA_CATEGORIES) console.log(`  "${category}"`);
    console.log('\nRun: npx tsx lib/pipeline/bulk-slay.ts "Snacks" [--limit N] [--auto-publish]');
    return;
  }

  const category = args.find((arg) => !arg.startsWith("--"));
  if (!category) {
    console.error(
      'Usage: npx tsx lib/pipeline/bulk-slay.ts "<category>" [--limit N] [--auto-publish]\n' +
        "       npx tsx lib/pipeline/bulk-slay.ts --categories",
    );
    process.exit(1);
  }

  const limitIndex = args.indexOf("--limit");
  const limit =
    limitIndex !== -1 ? Number.parseInt(args[limitIndex + 1] ?? "", 10) : Infinity;
  if (Number.isNaN(limit) || limit <= 0) {
    console.error("--limit needs a positive number");
    process.exit(1);
  }
  const saveStatus = args.includes("--auto-publish")
    ? ("published" as const)
    : ("pending-review" as const);

  console.log(
    `Bulk slay: category "${category}", limit ${limit === Infinity ? "none" : limit}, ` +
      `save as ${saveStatus}`,
  );

  const foods = await searchUSDA(category, USDA_PAGE_SIZE, "dataType.keyword");
  const lookups = foods
    .map(mapUsdaFood)
    .filter((result): result is ProductLookupResult => result !== null)
    .slice(0, Number.isFinite(limit) ? limit : undefined);
  console.log(`USDA returned ${foods.length} products; processing ${lookups.length}\n`);

  const results: BulkResult[] = [];
  for (let i = 0; i < lookups.length; i += MAX_CONCURRENT) {
    const batch = lookups.slice(i, i + MAX_CONCURRENT);
    const batchResults = await Promise.all(
      batch.map((lookup) => processOne(lookup, saveStatus)),
    );
    for (const result of batchResults) {
      results.push(result);
      const label =
        result.outcome === "slayed"
          ? `${result.score}/100 — ${result.verdictLabel}`
          : result.outcome === "skipped"
            ? "skipped (already exists)"
            : `FAILED — ${result.error}`;
      console.log(`  [${results.length}/${lookups.length}] ${result.name}: ${label}`);
    }
    if (i + MAX_CONCURRENT < lookups.length) await sleep(BATCH_DELAY_MS);
  }

  printSummary(results);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
