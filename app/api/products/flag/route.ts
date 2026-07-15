/**
 * User "Report label change": POST { slug, reason }.
 *
 * Marks the product flagged-for-review (it stays publicly visible) and files a
 * product_submissions row holding the reason, which feeds the admin review
 * queue. An admin re-slay is what actually refreshes the score.
 */

import {
  getProductBySlug,
  submitProduct,
  updateProductStatus,
} from "@/lib/database/queries";

const MAX_REASON_LENGTH = 1000;

interface FlagBody {
  slug?: string;
  reason?: string;
}

export async function POST(request: Request) {
  let body: FlagBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const reason = body.reason?.trim();
  if (!slug || !reason) {
    return Response.json(
      { error: "Both slug and reason are required" },
      { status: 400 },
    );
  }
  if (reason.length > MAX_REASON_LENGTH) {
    return Response.json(
      { error: `Reason must be ${MAX_REASON_LENGTH} characters or fewer` },
      { status: 400 },
    );
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return Response.json(
      { error: `No product found for slug "${slug}"` },
      { status: 404 },
    );
  }

  if (product.status !== "flagged-for-review") {
    await updateProductStatus(product.id, "flagged-for-review");
  }
  await submitProduct({
    product_name: product.name,
    brand: product.brand,
    barcode: product.barcode,
    status: "flagged-for-review",
    notes: reason,
    submitted_by: "label-change-report",
  });

  return Response.json({
    ok: true,
    message:
      "Thanks — this label is queued for re-review. The current slay stays up until we re-score it.",
  });
}
