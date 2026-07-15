/**
 * Supabase client setup.
 *
 * Two clients, two trust levels:
 *  - createBrowserClient(): anon key. RLS applies — public reads only.
 *  - createServerClient(): service role key. Bypasses RLS — pipeline writes,
 *    migrations, review queue. Server-side only; never ship this to a browser.
 */

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Missing ${name} — set it in .env.local (see .env.local.example)`,
    );
  }
  return value;
}

/** Anon-key client for client-side reads. RLS policies apply. */
export function createBrowserClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY"),
  );
}

/** Service-role client for pipeline writes. Bypasses RLS. Server-side only. */
export function createServerClient(): SupabaseClient {
  return createClient(
    requireEnv("NEXT_PUBLIC_SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    { auth: { persistSession: false, autoRefreshToken: false } },
  );
}

let cachedServerClient: SupabaseClient | null = null;

/** Memoized server client — one instance per process for pipeline/query use. */
export function getServerClient(): SupabaseClient {
  cachedServerClient ??= createServerClient();
  return cachedServerClient;
}
