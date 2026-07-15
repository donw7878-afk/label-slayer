/**
 * Admin sign-off on pending-review products: POST { slug, action } with the
 * x-admin-secret header.
 *
 *   action: "approve" — publish as-is; optionally pass an edited slayContent
 *           (the Edit & Publish flow) and it's saved before publishing.
 *   action: "reject"  — archive the product.
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { getProductBySlug } from "@/lib/database/queries";
import { getServerClient } from "@/lib/database/supabase";
import type { SlayContent } from "@/lib/slay-writer";

interface ModerateBody {
  slug?: string;
  action?: "approve" | "reject";
  slayContent?: SlayContent;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: ModerateBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  if (!slug || (body.action !== "approve" && body.action !== "reject")) {
    return Response.json(
      { error: "Provide slug and action ('approve' or 'reject')" },
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

  const client = getServerClient();
  const update: Record<string, unknown> = {
    status: body.action === "approve" ? "published" : "archived",
  };

  if (body.action === "approve" && body.slayContent) {
    const content = body.slayContent;
    if (
      typeof content.headline !== "string" ||
      typeof content.summary !== "string" ||
      !Array.isArray(content.redFlagBreakdown)
    ) {
      return Response.json(
        { error: "slayContent is missing required fields (headline, summary, redFlagBreakdown)" },
        { status: 400 },
      );
    }
    update.slay_content = content;
    update.slay_headline = content.headline;
    update.slay_summary = content.summary;
  }

  const { error } = await client.from("products").update(update).eq("id", product.id);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    slug: product.slug,
    status: update.status,
    edited: Boolean(body.action === "approve" && body.slayContent),
  });
}
