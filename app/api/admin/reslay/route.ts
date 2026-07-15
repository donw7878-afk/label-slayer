/**
 * Admin re-slay: the only way a stored slay gets regenerated.
 *
 * POST { slug | id, ingredientsRaw? } with the x-admin-secret header.
 * Re-runs the full pipeline (re-score → re-slay → update Supabase) and returns
 * a before/after comparison. Pass ingredientsRaw to score a reformulated label.
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import {
  getProductById,
  getProductBySlug,
  resolveFlaggedSubmissions,
} from "@/lib/database/queries";
import { slayProduct, type SlayProductInput } from "@/lib/pipeline";

interface ReslayBody {
  slug?: string;
  id?: string;
  ingredientsRaw?: string;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: ReslayBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const id = body.id?.trim();
  if (!slug && !id) {
    return Response.json(
      { error: "Provide a product slug or id" },
      { status: 400 },
    );
  }

  const product = slug
    ? await getProductBySlug(slug)
    : await getProductById(id!);
  if (!product) {
    return Response.json(
      { error: `No product found for ${slug ? `slug "${slug}"` : `id "${id}"`}` },
      { status: 404 },
    );
  }

  const ingredientsRaw =
    body.ingredientsRaw?.trim() || product.ingredients_raw?.trim();
  if (!ingredientsRaw) {
    return Response.json(
      { error: "Product has no ingredients_raw — supply ingredientsRaw to re-slay" },
      { status: 400 },
    );
  }

  const before = {
    score: product.score,
    verdict: product.verdict,
    verdictLabel: product.verdict_label,
    headline: product.slay_headline,
    reviewedAt: product.reviewed_at,
  };

  try {
    const { product: updated } = await slayProduct(
      {
        name: product.name,
        brand: product.brand ?? undefined,
        category: product.category ?? undefined,
        subcategory: product.subcategory ?? undefined,
        barcode: product.barcode ?? undefined,
        ingredientsRaw,
        isOrganic: product.is_organic,
        productFormat: product.product_format ?? undefined,
        imageUrl: product.image_url ?? undefined,
        source: (product.source as SlayProductInput["source"]) ?? undefined,
        sourceId: product.source_id ?? undefined,
        frontClaims: product.front_claims ?? undefined,
      },
      { forceReslay: true },
    );

    // The re-slay answers any open "label changed" reports for this product.
    await resolveFlaggedSubmissions(updated);

    return Response.json({
      slug: updated.slug,
      name: updated.name,
      brand: updated.brand,
      ingredientsUpdated: Boolean(body.ingredientsRaw?.trim()),
      before,
      after: {
        score: updated.score,
        verdict: updated.verdict,
        verdictLabel: updated.verdict_label,
        headline: updated.slay_headline,
        reviewedAt: updated.reviewed_at,
      },
    });
  } catch (err) {
    console.error("Admin re-slay failed:", err);
    return Response.json(
      { error: err instanceof Error ? err.message : "Re-slay failed" },
      { status: 500 },
    );
  }
}
