/**
 * Admin auth for internal tooling routes (app/api/admin/*).
 *
 * The caller sends the ADMIN_SECRET value in the x-admin-secret header; the
 * admin page collects it as a password and forwards it on every request.
 * Comparison is constant-time so the secret can't be guessed byte by byte.
 */

import { timingSafeEqual } from "node:crypto";

export function isAdminRequest(request: Request): boolean {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) return false;
  const provided = request.headers.get("x-admin-secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(secret);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function unauthorized(): Response {
  return Response.json(
    { error: "Unauthorized — invalid or missing admin secret" },
    { status: 401 },
  );
}
