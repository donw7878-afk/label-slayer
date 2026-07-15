/**
 * Admin product search: GET ?q=<name or slug> with the x-admin-secret header.
 * Substring match on slug, name, and brand — any status, not just published,
 * so flagged/draft products are findable from the admin page.
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { getServerClient } from "@/lib/database/supabase";
import type { ProductRow } from "@/lib/database/queries";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) {
    return Response.json({ error: "Provide a search query ?q=" }, { status: 400 });
  }

  // PostgREST .or() filters are comma/paren-delimited — strip those from the
  // user's query rather than trying to escape them.
  const term = q.replace(/[,()]/g, " ").trim();
  const client = getServerClient();
  const { data, error } = await client
    .from("products")
    .select(
      "id, slug, name, brand, category, score, verdict, verdict_label, slay_headline, status, reviewed_at, ingredients_raw",
    )
    .or(`slug.ilike.*${term}*,name.ilike.*${term}*,brand.ilike.*${term}*`)
    .order("name", { ascending: true })
    .limit(10);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ products: (data ?? []) as Partial<ProductRow>[] });
}
