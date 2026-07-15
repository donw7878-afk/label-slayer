/**
 * Product lookup: our database first, then Open Food Facts / Open Beauty Facts.
 *
 * External APIs go down, rate-limit, and return half-empty records — every
 * call here is wrapped with a timeout and returns null/[] instead of throwing
 * on network failure. Only programmer errors throw.
 */

import {
  getProductByBarcode,
  searchProducts,
  type ProductRow,
} from "../database/queries";
import type { LookupOutcome, ProductLookupResult, ProductSource } from "./types";

const FETCH_TIMEOUT_MS = 10_000;
const USER_AGENT = "LabelSlayer/1.0 (product research; contact via github)";

/** UPC/EAN: all digits, 8-14 chars. */
export function looksLikeBarcode(query: string): boolean {
  return /^\d{8,14}$/.test(query.trim());
}

/**
 * The same physical barcode circulates in multiple encodings — a 12-digit
 * UPC-A is often stored as a zero-padded 13-digit EAN-13 (Open Food Facts
 * does this). Check all equivalent forms so a database hit isn't missed.
 */
export function barcodeVariants(barcode: string): string[] {
  const variants = new Set<string>([barcode]);
  variants.add(barcode.replace(/^0+/, ""));
  if (barcode.length < 13) variants.add(barcode.padStart(13, "0"));
  if (barcode.length < 14) variants.add(barcode.padStart(14, "0"));
  return [...variants].filter((v) => v.length >= 8);
}

async function fetchJson(url: string): Promise<unknown | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": USER_AGENT },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    if (!response.ok) {
      console.warn(`Lookup: ${url} returned HTTP ${response.status}`);
      return null;
    }
    return await response.json();
  } catch (err) {
    console.warn(
      `Lookup: request to ${new URL(url).host} failed — ${(err as Error).message}`,
    );
    return null;
  }
}

// ---------------------------------------------------------------------------
// Open Food Facts / Open Beauty Facts response mapping
// ---------------------------------------------------------------------------

interface OffProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  ingredients_text?: string;
  ingredients_text_en?: string;
  image_url?: string;
  image_front_url?: string;
  categories_tags?: string[];
  labels_tags?: string[];
}

function inferIsOrganic(product: OffProduct): boolean {
  const labels = product.labels_tags ?? [];
  if (labels.some((tag) => tag.includes("organic"))) return true;
  return (product.product_name ?? "").toLowerCase().includes("organic");
}

function cleanTag(tag: string): string {
  return tag.replace(/^[a-z]{2}:/, "").replace(/-/g, " ");
}

function mapOffProduct(
  product: OffProduct,
  source: ProductSource,
  barcode: string | null,
): ProductLookupResult | null {
  const name = product.product_name?.trim();
  if (!name) return null;
  const subcategoryTag = product.categories_tags?.[0];
  return {
    name,
    brand: product.brands?.split(",")[0]?.trim() || null,
    ingredients_raw:
      product.ingredients_text_en?.trim() ||
      product.ingredients_text?.trim() ||
      null,
    barcode: product.code ?? barcode,
    category: source === "openbeautyfacts" ? "beauty" : "food",
    subcategory: subcategoryTag ? cleanTag(subcategoryTag) : null,
    imageUrl: product.image_front_url ?? product.image_url ?? null,
    source,
    sourceId: product.code ?? barcode,
    isOrganic: inferIsOrganic(product),
    existsInDatabase: false,
    slug: null,
  };
}

function mapDatabaseProduct(row: ProductRow): ProductLookupResult {
  return {
    name: row.name,
    brand: row.brand,
    ingredients_raw: row.ingredients_raw,
    barcode: row.barcode,
    category: row.category,
    subcategory: row.subcategory,
    imageUrl: row.image_url,
    source: (row.source as ProductSource) ?? "manual",
    sourceId: row.source_id,
    isOrganic: row.is_organic,
    existsInDatabase: true,
    slug: row.slug,
  };
}

// ---------------------------------------------------------------------------
// Barcode lookup
// ---------------------------------------------------------------------------

const BARCODE_APIS: Array<{ base: string; source: ProductSource }> = [
  { base: "https://world.openfoodfacts.org", source: "openfoodfacts" },
  { base: "https://world.openbeautyfacts.org", source: "openbeautyfacts" },
];

export async function lookupByBarcode(
  barcode: string,
): Promise<ProductLookupResult | null> {
  // 1. Our own database first — free, fast, already slayed. Check every
  // encoding variant (UPC-A vs zero-padded EAN-13).
  for (const variant of barcodeVariants(barcode)) {
    const existing = await getProductByBarcode(variant);
    if (existing) {
      console.log(`Lookup: ${barcode} found in Supabase (${existing.slug})`);
      return mapDatabaseProduct(existing);
    }
  }

  // 2. Open Food Facts, then Open Beauty Facts.
  for (const api of BARCODE_APIS) {
    const payload = (await fetchJson(
      `${api.base}/api/v2/product/${encodeURIComponent(barcode)}`,
    )) as { status?: number; product?: OffProduct } | null;
    if (payload?.status === 1 && payload.product) {
      const mapped = mapOffProduct(payload.product, api.source, barcode);
      if (mapped) {
        console.log(`Lookup: ${barcode} found on ${api.source} (${mapped.name})`);
        return mapped;
      }
    }
  }

  console.log(`Lookup: ${barcode} not found in database or external APIs`);
  return null;
}

// ---------------------------------------------------------------------------
// Name search
// ---------------------------------------------------------------------------

export async function searchByName(
  query: string,
  limit = 10,
): Promise<ProductLookupResult[]> {
  // 1. Our own full-text index first.
  const existing = await searchProducts(query, limit);
  if (existing.length > 0) {
    console.log(`Lookup: "${query}" matched ${existing.length} products in Supabase`);
    return existing.map(mapDatabaseProduct);
  }

  // 2. Open Food Facts search.
  const payload = (await fetchJson(
    `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=${limit}`,
  )) as { products?: OffProduct[] } | null;

  const products = payload?.products ?? [];
  const mapped = products
    .map((product) => mapOffProduct(product, "openfoodfacts", null))
    .filter((result): result is ProductLookupResult => result !== null);
  console.log(
    `Lookup: "${query}" matched ${mapped.length} products on Open Food Facts`,
  );
  return mapped;
}

// ---------------------------------------------------------------------------
// Dispatcher
// ---------------------------------------------------------------------------

/** Barcode-shaped queries get a single result; everything else is a search. */
export async function lookupProduct(query: string): Promise<LookupOutcome> {
  const trimmed = query.trim();
  if (looksLikeBarcode(trimmed)) {
    return { kind: "barcode", result: await lookupByBarcode(trimmed) };
  }
  return { kind: "search", results: await searchByName(trimmed) };
}
