/**
 * Typed CRUD for every Label Slayer table.
 *
 * All functions default to the memoized service-role client (server-side).
 * Pass an explicit client (e.g. a browser client) as the last argument for
 * RLS-scoped reads.
 */

import type { SupabaseClient } from "@supabase/supabase-js";
import type { SlayContent } from "../slay-writer";
import type { ScoreDeduction } from "../scoring";
import { getServerClient } from "./supabase";

// ---------------------------------------------------------------------------
// Row types — mirror lib/database/schema.sql
// ---------------------------------------------------------------------------

export interface ProductRow {
  id: string;
  slug: string;
  name: string;
  brand: string | null;
  category: string | null;
  subcategory: string | null;
  barcode: string | null;
  ingredients_raw: string | null;
  is_organic: boolean;
  product_format: string | null;
  image_url: string | null;
  source: string | null;
  source_id: string | null;
  front_claims: string[] | null;
  score: number | null;
  verdict: string | null;
  verdict_label: string | null;
  processing_level: string | null;
  red_flag_count: number | null;
  amber_flag_count: number | null;
  slay_headline: string | null;
  slay_summary: string | null;
  slay_content: SlayContent | null;
  deductions: ScoreDeduction[] | null;
  status:
    | "published"
    | "draft"
    | "pending-review"
    | "archived"
    | "flagged-for-review";
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

/** Insertable/upsertable product — DB-generated fields optional or absent. */
export type ProductUpsert = Omit<
  Partial<ProductRow>,
  "id" | "created_at" | "updated_at"
> & {
  slug: string;
  name: string;
};

export interface IngredientRow {
  id: string;
  slug: string;
  canonical_name: string;
  alternate_names: string[] | null;
  category: string | null;
  flag_level: "red" | "amber" | "green" | null;
  deduction_points: number | null;
  reason: string | null;
  what_it_is: string | null;
  why_used: string | null;
  where_found: string | null;
  our_take: string | null;
  why_flagged: string[] | null;
  banned_in_countries: string[] | null;
  cleaner_alternatives: string | null;
  sources: string[] | null;
  reviewed_at: string | null;
  created_at: string;
  updated_at: string;
}

export type IngredientUpsert = Omit<
  Partial<IngredientRow>,
  "id" | "created_at" | "updated_at"
> & {
  slug: string;
  canonical_name: string;
};

export interface ProductIngredientRow {
  product_id: string;
  ingredient_id: string;
  position: number;
  flag_level: "red" | "amber" | "green" | null;
  deduction_applied: number | null;
}

/** A product's ingredient link joined with the full ingredient record. */
export interface ProductIngredientWithDetail extends ProductIngredientRow {
  ingredient: IngredientRow;
}

export interface ProductSubmissionRow {
  id: string;
  product_name: string | null;
  brand: string | null;
  barcode: string | null;
  ingredients_raw: string | null;
  image_url: string | null;
  submitted_by: string | null;
  status: "pending" | "approved" | "rejected" | "duplicate" | "flagged-for-review";
  notes: string | null;
  created_at: string;
}

export type ProductSubmissionInsert = Omit<
  Partial<ProductSubmissionRow>,
  "id" | "created_at"
>;

export interface CleanSwapRow {
  id: string;
  product_id: string;
  swap_product_id: string;
  reason: string | null;
  created_at: string;
}

/** A clean swap joined with the full swap-target product. */
export interface CleanSwapWithProduct extends CleanSwapRow {
  swap_product: ProductRow;
}

// ---------------------------------------------------------------------------
// Products
// ---------------------------------------------------------------------------

export async function getProductBySlug(
  slug: string,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow | null> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getProductBySlug(${slug}): ${error.message}`);
  return data as ProductRow | null;
}

export async function getProductById(
  id: string,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow | null> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(`getProductById(${id}): ${error.message}`);
  return data as ProductRow | null;
}

export async function updateProductStatus(
  id: string,
  status: ProductRow["status"],
  client: SupabaseClient = getServerClient(),
): Promise<void> {
  const { error } = await client
    .from("products")
    .update({ status })
    .eq("id", id);
  if (error) throw new Error(`updateProductStatus(${id}): ${error.message}`);
}

export async function getProductByBarcode(
  barcode: string,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow | null> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("barcode", barcode)
    .maybeSingle();
  if (error) {
    throw new Error(`getProductByBarcode(${barcode}): ${error.message}`);
  }
  return data as ProductRow | null;
}

export async function getProductsByCategory(
  category: string,
  limit = 20,
  offset = 0,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow[]> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .eq("category", category)
    .in("status", ["published", "flagged-for-review"])
    .order("score", { ascending: true, nullsFirst: false })
    .range(offset, offset + limit - 1);
  if (error) {
    throw new Error(`getProductsByCategory(${category}): ${error.message}`);
  }
  return (data ?? []) as ProductRow[];
}

export async function searchProducts(
  query: string,
  limit = 10,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow[]> {
  const { data, error } = await client
    .from("products")
    .select("*")
    .textSearch("search_vector", query, { type: "websearch", config: "english" })
    .in("status", ["published", "flagged-for-review"])
    .limit(limit);
  if (error) throw new Error(`searchProducts(${query}): ${error.message}`);
  return (data ?? []) as ProductRow[];
}

export async function upsertProduct(
  product: ProductUpsert,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow> {
  const { data, error } = await client
    .from("products")
    .upsert(product, { onConflict: "slug" })
    .select()
    .single();
  if (error) throw new Error(`upsertProduct(${product.slug}): ${error.message}`);
  return data as ProductRow;
}

// ---------------------------------------------------------------------------
// Ingredients
// ---------------------------------------------------------------------------

export async function getIngredientBySlug(
  slug: string,
  client: SupabaseClient = getServerClient(),
): Promise<IngredientRow | null> {
  const { data, error } = await client
    .from("ingredients")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`getIngredientBySlug(${slug}): ${error.message}`);
  return data as IngredientRow | null;
}

export async function getIngredientsBySlugs(
  slugs: string[],
  client: SupabaseClient = getServerClient(),
): Promise<IngredientRow[]> {
  if (slugs.length === 0) return [];
  const { data, error } = await client
    .from("ingredients")
    .select("*")
    .in("slug", slugs);
  if (error) throw new Error(`getIngredientsBySlugs: ${error.message}`);
  return (data ?? []) as IngredientRow[];
}

export async function getIngredientsForProduct(
  productId: string,
  client: SupabaseClient = getServerClient(),
): Promise<ProductIngredientWithDetail[]> {
  const { data, error } = await client
    .from("product_ingredients")
    .select("*, ingredient:ingredients(*)")
    .eq("product_id", productId)
    .order("position", { ascending: true });
  if (error) {
    throw new Error(`getIngredientsForProduct(${productId}): ${error.message}`);
  }
  return (data ?? []) as unknown as ProductIngredientWithDetail[];
}

export async function getProductsContainingIngredient(
  ingredientId: string,
  limit = 20,
  client: SupabaseClient = getServerClient(),
): Promise<ProductRow[]> {
  const { data, error } = await client
    .from("product_ingredients")
    .select("product:products(*)")
    .eq("ingredient_id", ingredientId)
    .limit(limit);
  if (error) {
    throw new Error(
      `getProductsContainingIngredient(${ingredientId}): ${error.message}`,
    );
  }
  const rows = (data ?? []) as unknown as Array<{ product: ProductRow | null }>;
  return rows
    .map((row) => row.product)
    .filter((product): product is ProductRow => product !== null);
}

export async function upsertIngredient(
  ingredient: IngredientUpsert,
  client: SupabaseClient = getServerClient(),
): Promise<IngredientRow> {
  const { data, error } = await client
    .from("ingredients")
    .upsert(ingredient, { onConflict: "slug" })
    .select()
    .single();
  if (error) {
    throw new Error(`upsertIngredient(${ingredient.slug}): ${error.message}`);
  }
  return data as IngredientRow;
}

/** Batch upsert for seeding. Chunks to stay under request size limits. */
export async function upsertIngredients(
  ingredients: IngredientUpsert[],
  client: SupabaseClient = getServerClient(),
): Promise<number> {
  const CHUNK = 500;
  let count = 0;
  for (let i = 0; i < ingredients.length; i += CHUNK) {
    const chunk = ingredients.slice(i, i + CHUNK);
    const { error } = await client
      .from("ingredients")
      .upsert(chunk, { onConflict: "slug" });
    if (error) {
      throw new Error(`upsertIngredients (batch ${i / CHUNK}): ${error.message}`);
    }
    count += chunk.length;
  }
  return count;
}

// ---------------------------------------------------------------------------
// Product ↔ ingredient links
// ---------------------------------------------------------------------------

export type ProductIngredientLink = Omit<ProductIngredientRow, "product_id">;

/**
 * Replaces the product's ingredient links with the given set. Delete-then-
 * insert keeps re-scores honest when a reformulation drops an ingredient.
 */
export async function linkProductIngredients(
  productId: string,
  ingredients: ProductIngredientLink[],
  client: SupabaseClient = getServerClient(),
): Promise<void> {
  const del = await client
    .from("product_ingredients")
    .delete()
    .eq("product_id", productId);
  if (del.error) {
    throw new Error(`linkProductIngredients delete: ${del.error.message}`);
  }
  if (ingredients.length === 0) return;
  const rows = ingredients.map((ing) => ({ ...ing, product_id: productId }));
  const ins = await client.from("product_ingredients").insert(rows);
  if (ins.error) {
    throw new Error(`linkProductIngredients insert: ${ins.error.message}`);
  }
}

// ---------------------------------------------------------------------------
// Submissions
// ---------------------------------------------------------------------------

export async function submitProduct(
  submission: ProductSubmissionInsert,
  client: SupabaseClient = getServerClient(),
): Promise<ProductSubmissionRow> {
  const { data, error } = await client
    .from("product_submissions")
    .insert(submission)
    .select()
    .single();
  if (error) throw new Error(`submitProduct: ${error.message}`);
  return data as ProductSubmissionRow;
}

export async function findSubmissionByBarcode(
  barcode: string,
  client: SupabaseClient = getServerClient(),
): Promise<ProductSubmissionRow | null> {
  const { data, error } = await client
    .from("product_submissions")
    .select("*")
    .eq("barcode", barcode)
    .limit(1)
    .maybeSingle();
  if (error) {
    throw new Error(`findSubmissionByBarcode(${barcode}): ${error.message}`);
  }
  return data as ProductSubmissionRow | null;
}

/** Recent user "label changed" reports awaiting an admin re-slay. */
export async function getFlaggedSubmissions(
  limit = 20,
  client: SupabaseClient = getServerClient(),
): Promise<ProductSubmissionRow[]> {
  const { data, error } = await client
    .from("product_submissions")
    .select("*")
    .eq("status", "flagged-for-review")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(`getFlaggedSubmissions: ${error.message}`);
  return (data ?? []) as ProductSubmissionRow[];
}

/**
 * Marks a product's open "label changed" reports as approved — called after a
 * re-slay so handled flags drop off the admin review list.
 */
export async function resolveFlaggedSubmissions(
  product: Pick<ProductRow, "name" | "barcode">,
  client: SupabaseClient = getServerClient(),
): Promise<void> {
  const query = client
    .from("product_submissions")
    .update({ status: "approved" })
    .eq("status", "flagged-for-review");
  const { error } = await (product.barcode
    ? query.eq("barcode", product.barcode)
    : query.eq("product_name", product.name));
  if (error) throw new Error(`resolveFlaggedSubmissions: ${error.message}`);
}

// ---------------------------------------------------------------------------
// Clean swaps
// ---------------------------------------------------------------------------

export async function getCleanSwaps(
  productId: string,
  client: SupabaseClient = getServerClient(),
): Promise<CleanSwapWithProduct[]> {
  const { data, error } = await client
    .from("clean_swaps")
    .select("*, swap_product:products!clean_swaps_swap_product_id_fkey(*)")
    .eq("product_id", productId);
  if (error) throw new Error(`getCleanSwaps(${productId}): ${error.message}`);
  return (data ?? []) as unknown as CleanSwapWithProduct[];
}

export async function addCleanSwap(
  productId: string,
  swapProductId: string,
  reason: string,
  client: SupabaseClient = getServerClient(),
): Promise<CleanSwapRow> {
  const { data, error } = await client
    .from("clean_swaps")
    .upsert(
      { product_id: productId, swap_product_id: swapProductId, reason },
      { onConflict: "product_id,swap_product_id" },
    )
    .select()
    .single();
  if (error) {
    throw new Error(
      `addCleanSwap(${productId} -> ${swapProductId}): ${error.message}`,
    );
  }
  return data as CleanSwapRow;
}
