/**
 * USDA FoodData Central lookup — the primary external data source.
 *
 * Branded Foods data comes straight from manufacturer label submissions, so
 * the ingredient strings are much cleaner than crowdsourced sources. Free API
 * key from https://fdc.nal.usda.gov/api-key-signup (3,600 requests/hour).
 *
 * Same failure philosophy as lookup.ts: network/rate-limit/timeout problems
 * log a warning and return null/[] so the lookup chain falls through to the
 * next source. Only programmer errors throw.
 */

import type { ProductLookupResult } from "./types";

const USDA_BASE_URL = "https://api.nal.usda.gov/fdc/v1";
const FETCH_TIMEOUT_MS = 10_000;

/** The Branded Foods fields we consume from /foods/search and /food/{id}. */
export interface UsdaFood {
  fdcId: number;
  description?: string;
  brandOwner?: string;
  brandName?: string;
  ingredients?: string;
  gtinUpc?: string;
  /** Present on /food/{id} detail responses. */
  brandedFoodCategory?: string;
  /** Present on /foods/search responses (same value, different field name). */
  foodCategory?: string;
  dataType?: string;
}

interface UsdaSearchResponse {
  totalHits?: number;
  foods?: UsdaFood[];
}

function apiKey(): string | null {
  return process.env.USDA_API_KEY || null;
}

async function usdaFetch(path: string, params: Record<string, string>): Promise<unknown | null> {
  const key = apiKey();
  if (!key) {
    console.warn("USDA: USDA_API_KEY not set — skipping USDA lookup");
    return null;
  }
  const url = new URL(`${USDA_BASE_URL}${path}`);
  for (const [name, value] of Object.entries(params)) {
    url.searchParams.set(name, value);
  }
  url.searchParams.set("api_key", key);

  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (response.status === 429) {
      console.warn("USDA: rate limited (429) — falling through to next source");
      return null;
    }
    if (!response.ok) {
      console.warn(`USDA: ${path} returned HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(`USDA: request to ${path} failed — ${(err as Error).message}`);
    return null;
  }
}

// ---------------------------------------------------------------------------
// Lookups
// ---------------------------------------------------------------------------

/** Search Branded Foods by product name. */
export async function searchUSDA(
  query: string,
  pageSize = 10,
  sortBy?: string,
): Promise<UsdaFood[]> {
  const params: Record<string, string> = {
    query,
    dataType: "Branded",
    pageSize: String(pageSize),
  };
  if (sortBy) params.sortBy = sortBy;
  const payload = (await usdaFetch("/foods/search", params)) as UsdaSearchResponse | null;
  return payload?.foods ?? [];
}

/** Leading zeros are encoding noise — UPC-A vs zero-padded EAN-13/GTIN-14. */
function normalizeBarcode(code: string): string {
  return code.trim().replace(/^0+/, "");
}

/** Look up a single Branded Food by UPC/GTIN. Exact barcode match only. */
export async function lookupUSDAByBarcode(barcode: string): Promise<UsdaFood | null> {
  const payload = (await usdaFetch("/foods/search", {
    query: barcode,
    dataType: "Branded",
  })) as UsdaSearchResponse | null;

  const target = normalizeBarcode(barcode);
  const match = (payload?.foods ?? []).find(
    (food) => food.gtinUpc && normalizeBarcode(food.gtinUpc) === target,
  );
  return match ?? null;
}

/** Full product detail for one fdcId. */
export async function getUSDAProduct(fdcId: number): Promise<UsdaFood | null> {
  const payload = await usdaFetch(`/food/${fdcId}`, {});
  if (!payload || typeof (payload as UsdaFood).fdcId !== "number") return null;
  return payload as UsdaFood;
}

// ---------------------------------------------------------------------------
// Mapping to the pipeline's lookup shape
// ---------------------------------------------------------------------------

function usdaCategory(food: UsdaFood): string | undefined {
  return food.brandedFoodCategory ?? food.foodCategory;
}

function inferIsOrganic(food: UsdaFood): boolean {
  return [food.description, usdaCategory(food)]
    .filter(Boolean)
    .some((text) => text!.toLowerCase().includes("organic"));
}

/** USDA descriptions are usually SHOUTED — bring them down to title case. */
function normalizeCase(text: string): string {
  if (text !== text.toUpperCase()) return text;
  return text
    .toLowerCase()
    .replace(/(^|[\s\-(/])([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
}

export function mapUsdaFood(food: UsdaFood): ProductLookupResult | null {
  const name = food.description?.trim();
  if (!name) return null;
  const brand = (food.brandName || food.brandOwner)?.trim() || null;
  return {
    name: normalizeCase(name),
    brand: brand ? normalizeCase(brand) : null,
    ingredients_raw: food.ingredients?.trim() || null,
    barcode: food.gtinUpc?.trim() || null,
    category: "food",
    subcategory: usdaCategory(food)?.trim().toLowerCase() || null,
    imageUrl: null,
    source: "usda",
    sourceId: String(food.fdcId),
    isOrganic: inferIsOrganic(food),
    existsInDatabase: false,
    slug: null,
  };
}
