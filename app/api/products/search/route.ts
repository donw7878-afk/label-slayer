/**
 * Hybrid product search: GET ?q=search+term or ?barcode=028400443685.
 *
 * Returns two arrays:
 *   slayed   — products already in Supabase, with full slay content
 *   unslayed — products found externally (USDA → Open Food Facts) that
 *              haven't been scored yet; no score/slay until the pipeline runs
 *
 * External sources are only queried when Supabase returns fewer than 5 hits.
 */

import {
  getProductByBarcode,
  searchProducts,
  type ProductRow,
} from "@/lib/database/queries";
import { barcodeVariants, lookupByBarcode, searchExternal } from "@/lib/pipeline/lookup";
import type { ProductLookupResult } from "@/lib/pipeline";

const MIN_SLAYED_BEFORE_EXTERNAL = 5;

function toSlayed(product: ProductRow) {
  return {
    slug: product.slug,
    category_slug: product.category_slug,
    brand_slug: product.brand_slug,
    name: product.name,
    brand: product.brand,
    category: product.category,
    barcode: product.barcode,
    score: product.score,
    verdict: product.verdict,
    verdict_label: product.verdict_label,
    slay_headline: product.slay_headline,
    slay_summary: product.slay_summary,
    slay_content: product.slay_content,
    image_url: product.image_url,
    reviewed_at: product.reviewed_at,
  };
}

function toUnslayed(lookup: ProductLookupResult) {
  return {
    name: lookup.name,
    brand: lookup.brand,
    barcode: lookup.barcode,
    ingredients_raw: lookup.ingredients_raw,
    source: lookup.source,
    sourceId: lookup.sourceId,
    category: lookup.category,
    subcategory: lookup.subcategory,
    imageUrl: lookup.imageUrl,
    isOrganic: lookup.isOrganic,
  };
}

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const q = params.get("q")?.trim();
  const barcode = params.get("barcode")?.trim();

  if (!q && !barcode) {
    return Response.json(
      { error: "Provide ?q=<search term> or ?barcode=<UPC>" },
      { status: 400 },
    );
  }

  try {
    if (barcode) {
      // Barcode path: one product, slayed or not.
      for (const variant of barcodeVariants(barcode)) {
        const existing = await getProductByBarcode(variant);
        if (existing && existing.slay_content) {
          return Response.json({ slayed: [toSlayed(existing)], unslayed: [] });
        }
      }
      const lookup = await lookupByBarcode(barcode);
      return Response.json({
        slayed: [],
        unslayed: lookup && !lookup.existsInDatabase ? [toUnslayed(lookup)] : [],
      });
    }

    // Name path: Supabase first, external only when results are thin.
    const rows = await searchProducts(q!, 10);
    const slayed = rows.filter((row) => row.slay_content).map(toSlayed);

    let unslayed: ReturnType<typeof toUnslayed>[] = [];
    if (slayed.length < MIN_SLAYED_BEFORE_EXTERNAL) {
      const knownBarcodes = new Set(
        slayed
          .map((p) => p.barcode?.replace(/^0+/, ""))
          .filter((code): code is string => Boolean(code)),
      );
      const external = await searchExternal(q!, 10);
      unslayed = external
        .filter(
          (r) =>
            !r.existsInDatabase &&
            (!r.barcode || !knownBarcodes.has(r.barcode.replace(/^0+/, ""))),
        )
        .map(toUnslayed);
    }

    return Response.json({ slayed, unslayed });
  } catch (err) {
    console.error("Product search failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Search failed" },
      { status: 500 },
    );
  }
}
