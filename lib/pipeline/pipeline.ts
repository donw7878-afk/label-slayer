/**
 * The Label Slayer pipeline: product in, slay out, everything persisted.
 *
 *   lookup → score (deterministic) → slay (AI) → store (Supabase)
 *
 * slayProduct() is the core orchestrator; slayByBarcode() and slayBySearch()
 * are the entry points the app calls.
 */

import {
  scoreProduct,
  parseIngredients,
  type ProductFormat,
} from "../scoring";
import { generateSlay, type SlayContent } from "../slay-writer";
import { getServerClient } from "../database/supabase";
import {
  addCleanSwap,
  getIngredientsBySlugs,
  getProductByBarcode,
  getProductBySlug,
  linkProductIngredients,
  upsertProduct,
  type ProductIngredientLink,
  type ProductRow,
  type ProductUpsert,
} from "../database/queries";
import { lookupByBarcode, searchByName } from "./lookup";
import type { SlayProductInput, SlayResult } from "./types";

const CACHE_FRESH_DAYS = 90;

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function productSlug(name: string, brand?: string | null): string {
  return slugify([brand, name].filter(Boolean).join(" "));
}

function isFresh(product: ProductRow): boolean {
  if (!product.slay_content || product.score === null) return false;
  const stamped = product.reviewed_at ?? product.updated_at;
  const ageMs = Date.now() - new Date(stamped).getTime();
  return ageMs < CACHE_FRESH_DAYS * 24 * 60 * 60 * 1000;
}

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function slayProduct(
  input: SlayProductInput,
): Promise<{ product: ProductRow; slayContent: SlayContent; fromCache: boolean }> {
  const slug = productSlug(input.name, input.brand);
  console.log(`Pipeline: slaying "${input.name}" (${slug})`);

  // --- 1-2. Cache check: barcode first, slug second -------------------------
  const existing =
    (input.barcode ? await getProductByBarcode(input.barcode) : null) ??
    (await getProductBySlug(slug));

  if (existing && isFresh(existing)) {
    console.log(
      `Pipeline: cache hit — reviewed ${existing.reviewed_at ?? existing.updated_at}, returning stored slay`,
    );
    return { product: existing, slayContent: existing.slay_content!, fromCache: true };
  }
  if (existing) {
    console.log("Pipeline: cached record is stale (>90 days) — re-scoring");
  }

  // --- 3. Score Engine (deterministic, free) --------------------------------
  console.log("Pipeline: scoring ingredients...");
  const scoreResult = scoreProduct(
    input.ingredientsRaw,
    input.isOrganic ?? false,
    input.productFormat as ProductFormat | undefined,
  );
  console.log(
    `Pipeline: scored ${scoreResult.finalScore}/100 — ${scoreResult.verdictLabel} ` +
      `(${scoreResult.redFlagCount} red, ${scoreResult.amberFlagCount} amber)`,
  );

  // --- 4. Slay Writer (AI) ---------------------------------------------------
  console.log("Pipeline: generating slay...");
  const slayContent = await generateSlay(
    input.name,
    input.brand ?? "Unknown",
    input.category ?? "food",
    scoreResult,
    input.frontClaims,
  );
  console.log(`Pipeline: slay generated — "${slayContent.headline}"`);

  // --- 6a. Upsert the product ------------------------------------------------
  const upsert: ProductUpsert = {
    slug: existing?.slug ?? slug,
    name: input.name,
    brand: input.brand ?? null,
    category: input.category ?? null,
    subcategory: input.subcategory ?? null,
    barcode: input.barcode ?? null,
    ingredients_raw: input.ingredientsRaw,
    is_organic: input.isOrganic ?? false,
    product_format: input.productFormat ?? null,
    image_url: input.imageUrl ?? null,
    source: input.source ?? "manual",
    source_id: input.sourceId ?? null,
    front_claims: input.frontClaims ?? null,
    score: scoreResult.finalScore,
    verdict: scoreResult.verdict,
    verdict_label: scoreResult.verdictLabel,
    processing_level: scoreResult.processingLevel,
    red_flag_count: scoreResult.redFlagCount,
    amber_flag_count: scoreResult.amberFlagCount,
    slay_headline: slayContent.headline,
    slay_summary: slayContent.summary,
    slay_content: slayContent,
    deductions: scoreResult.deductions,
    status: "published",
    reviewed_at: new Date().toISOString(),
  };
  const product = await upsertProduct(upsert);
  console.log(`Pipeline: product saved (${product.id})`);

  // --- 5 + 6b. Link parsed ingredients to the ingredient database ------------
  const parsed = parseIngredients(input.ingredientsRaw);
  const matched = parsed.filter((ing) => ing.matched);
  const slugsToFind = [...new Set(matched.map((ing) => slugify(ing.canonicalName)))];
  const ingredientRows = await getIngredientsBySlugs(slugsToFind);
  const idBySlug = new Map(ingredientRows.map((row) => [row.slug, row.id]));

  const links = new Map<string, ProductIngredientLink>();
  for (const ing of matched) {
    const ingredientId = idBySlug.get(slugify(ing.canonicalName));
    if (!ingredientId || links.has(ingredientId)) continue; // first occurrence wins
    links.set(ingredientId, {
      ingredient_id: ingredientId,
      position: ing.position,
      flag_level: ing.flagLevel,
      deduction_applied: ing.countedInScore ? ing.deductionPoints : 0,
    });
  }
  await linkProductIngredients(product.id, [...links.values()]);
  console.log(
    `Pipeline: linked ${links.size} ingredients (${matched.length} matched of ${parsed.length} parsed)`,
  );

  // --- 6c. Auto-generate clean swaps -----------------------------------------
  if (product.category && product.score !== null) {
    const client = getServerClient();
    const { data: candidates, error } = await client
      .from("products")
      .select("id, slug, name, score")
      .eq("category", product.category)
      .eq("status", "published")
      .gt("score", product.score + 20)
      .neq("id", product.id)
      .order("score", { ascending: false })
      .limit(3);
    if (error) {
      console.warn(`Pipeline: clean-swap lookup failed — ${error.message}`);
    } else if (candidates && candidates.length > 0) {
      for (const candidate of candidates) {
        await addCleanSwap(
          product.id,
          candidate.id as string,
          `Scores ${candidate.score} vs ${product.score} in the same category`,
        );
      }
      console.log(`Pipeline: added ${candidates.length} clean swaps`);
    } else {
      console.log("Pipeline: no clean-swap candidates yet in this category");
    }
  }

  return { product, slayContent, fromCache: false };
}

// ---------------------------------------------------------------------------
// Entry points
// ---------------------------------------------------------------------------

export async function slayByBarcode(barcode: string): Promise<SlayResult> {
  console.log(`Pipeline: barcode lookup ${barcode}`);
  const lookup = await lookupByBarcode(barcode);

  if (!lookup) {
    return {
      status: "not-found",
      message: `No product found for barcode ${barcode} in our database, Open Food Facts, or Open Beauty Facts. Submit it for review and we'll slay it.`,
    };
  }

  if (!lookup.ingredients_raw) {
    return {
      status: "needs-submission",
      lookup,
      message: `Found "${lookup.name}" but no ingredient list is available. Submit the label and we'll take it from there.`,
    };
  }

  // Fresh cached record: skip the pipeline entirely.
  if (lookup.existsInDatabase && lookup.slug) {
    const existing = await getProductBySlug(lookup.slug);
    if (existing && existing.slay_content && existing.score !== null) {
      const { product, slayContent, fromCache } = await slayProduct({
        name: existing.name,
        brand: existing.brand ?? undefined,
        category: existing.category ?? undefined,
        subcategory: existing.subcategory ?? undefined,
        barcode: existing.barcode ?? undefined,
        ingredientsRaw: existing.ingredients_raw ?? lookup.ingredients_raw,
        isOrganic: existing.is_organic,
        productFormat: existing.product_format ?? undefined,
        imageUrl: existing.image_url ?? undefined,
        source: (existing.source as SlayProductInput["source"]) ?? undefined,
        sourceId: existing.source_id ?? undefined,
        frontClaims: existing.front_claims ?? undefined,
      });
      return { status: "slayed", product, slayContent, fromCache };
    }
  }

  const { product, slayContent, fromCache } = await slayProduct({
    name: lookup.name,
    brand: lookup.brand ?? undefined,
    category: lookup.category ?? undefined,
    subcategory: lookup.subcategory ?? undefined,
    barcode: lookup.barcode ?? barcode,
    ingredientsRaw: lookup.ingredients_raw,
    isOrganic: lookup.isOrganic,
    imageUrl: lookup.imageUrl ?? undefined,
    source: lookup.source,
    sourceId: lookup.sourceId ?? undefined,
  });
  return { status: "slayed", product, slayContent, fromCache };
}

export async function slayBySearch(query: string): Promise<SlayResult[]> {
  console.log(`Pipeline: search "${query}"`);
  const results = await searchByName(query);

  if (results.length === 0) {
    return [
      {
        status: "not-found",
        message: `Nothing found for "${query}". Submit the product and we'll slay it.`,
      },
    ];
  }

  const out: SlayResult[] = [];
  for (const lookup of results) {
    if (lookup.existsInDatabase && lookup.slug) {
      const product = await getProductBySlug(lookup.slug);
      if (product?.slay_content) {
        out.push({
          status: "slayed",
          product,
          slayContent: product.slay_content,
          fromCache: true,
        });
        continue;
      }
    }
    // Known to an external API but not slayed yet — hand back what we know so
    // the user can submit it (auto-slaying a whole search page would burn AI
    // calls on products nobody asked about).
    out.push({
      status: "needs-submission",
      lookup,
      message: lookup.ingredients_raw
        ? `"${lookup.name}" isn't in our database yet — submit it and we'll slay it.`
        : `"${lookup.name}" has no ingredient list on record — submit the label and we'll slay it.`,
    });
  }
  return out;
}
