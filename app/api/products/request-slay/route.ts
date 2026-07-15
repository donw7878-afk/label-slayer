/**
 * Queue a product for a full slay: POST product data (usually an unslayed
 * search result), run the complete pipeline — clean name → score → slay →
 * save — with status "pending-review" so an admin signs off before it goes
 * public. Also files a product_submissions record ("auto-slayed") so the
 * admin dashboard surfaces it.
 */

import { submitProduct } from "@/lib/database/queries";
import { cleanProductName, slayProduct, type SlayProductInput } from "@/lib/pipeline";

const EXTERNAL_SOURCES = new Set(["usda", "openfoodfacts", "openbeautyfacts"]);

interface RequestSlayBody {
  name?: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  barcode?: string;
  ingredientsRaw?: string;
  isOrganic?: boolean;
  productFormat?: string;
  imageUrl?: string;
  source?: string;
  sourceId?: string;
  frontClaims?: string[];
}

export async function POST(request: Request) {
  let body: RequestSlayBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawName = body.name?.trim();
  const ingredientsRaw = body.ingredientsRaw?.trim();
  if (!rawName || !ingredientsRaw) {
    return Response.json(
      { error: "Both name and ingredientsRaw are required" },
      { status: 400 },
    );
  }

  try {
    // External-source names get the AI cleanup, same as the barcode pipeline.
    const isExternal = EXTERNAL_SOURCES.has(body.source ?? "");
    const name = isExternal
      ? await cleanProductName(rawName, body.brand)
      : rawName;

    const { product, fromCache } = await slayProduct(
      {
        name,
        nameRaw: isExternal ? rawName : undefined,
        brand: body.brand,
        category: body.category,
        subcategory: body.subcategory,
        barcode: body.barcode,
        ingredientsRaw,
        isOrganic: body.isOrganic,
        productFormat: body.productFormat,
        imageUrl: body.imageUrl,
        source: (body.source as SlayProductInput["source"]) ?? "user-submitted",
        sourceId: body.sourceId,
        frontClaims: body.frontClaims,
      },
      { saveStatus: "pending-review" },
    );

    // A cache hit means it was already slayed — nothing new to review.
    if (!fromCache) {
      await submitProduct({
        product_name: product.name,
        brand: product.brand,
        barcode: product.barcode,
        ingredients_raw: product.ingredients_raw,
        status: "auto-slayed",
        submitted_by: "request-slay",
        notes: `Auto-slayed at ${product.score}/100 (${product.verdict_label}) — awaiting review`,
      });
    }

    return Response.json({
      ok: true,
      slug: product.slug,
      score: product.score,
      verdict: product.verdict,
      verdictLabel: product.verdict_label,
      headline: product.slay_headline,
      alreadySlayed: fromCache,
      message: fromCache
        ? `Already slayed: ${product.score}/100 — ${product.verdict_label}.`
        : `This product has entered the Slayer's queue. Score: ${product.score} — ${product.verdict_label}. Full slay dropping soon.`,
    });
  } catch (err) {
    console.error("Request-slay failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Slay request failed" },
      { status: 500 },
    );
  }
}
