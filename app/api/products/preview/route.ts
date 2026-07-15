/**
 * Instant preview score: POST product data, get back the deterministic Score
 * Engine result. No Slay Writer call — free, instant, no AI cost. The full
 * slay comes later via /api/products/request-slay.
 */

import { scoreProduct, type ProductFormat } from "@/lib/scoring";

interface PreviewBody {
  ingredientsRaw?: string;
  isOrganic?: boolean;
  productFormat?: string;
}

export async function POST(request: Request) {
  let body: PreviewBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const ingredientsRaw = body.ingredientsRaw?.trim();
  if (!ingredientsRaw) {
    return Response.json({ error: "ingredientsRaw is required" }, { status: 400 });
  }

  const result = scoreProduct(
    ingredientsRaw,
    body.isOrganic ?? false,
    body.productFormat as ProductFormat | undefined,
  );

  return Response.json({
    score: result.finalScore,
    verdict: result.verdict,
    verdictLabel: result.verdictLabel,
    processingLevel: result.processingLevel,
    redFlagCount: result.redFlagCount,
    amberFlagCount: result.amberFlagCount,
    flaggedIngredientCount: result.flaggedIngredients.length,
  });
}
