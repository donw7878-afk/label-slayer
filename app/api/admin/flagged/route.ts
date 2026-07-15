/**
 * Admin review queue: GET with the x-admin-secret header returns recent user
 * "label changed" reports (product_submissions with status flagged-for-review).
 * Also doubles as the admin page's login check — 200 means the secret is good.
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { getFlaggedSubmissions } from "@/lib/database/queries";

export async function GET(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  const flagged = await getFlaggedSubmissions(20);
  return Response.json({ flagged });
}
