/**
 * Admin review queue for auto-slayed products: GET with the x-admin-secret
 * header returns products sitting at status "pending-review" (request-slay
 * and bulk-slay output awaiting sign-off).
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { getServerClient } from "@/lib/database/supabase";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  const client = getServerClient();
  const { data, error } = await client
    .from("products")
    .select(
      "id, slug, name, brand, score, verdict, verdict_label, slay_headline, slay_summary, slay_content, reviewed_at",
    )
    .eq("status", "pending-review")
    .order("reviewed_at", { ascending: false })
    .limit(50);
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ pending: data ?? [] });
}
