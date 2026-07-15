/**
 * Label Slayer database migration.
 *
 *   npx tsx lib/database/migrate.ts
 *
 * 1. Applies lib/database/schema.sql to Supabase (idempotent — every
 *    statement is IF NOT EXISTS / CREATE OR REPLACE / DROP-then-CREATE).
 * 2. Seeds the ingredients table from the Score Engine's ingredient-db.ts.
 *
 * DDL over Supabase's REST API requires a one-time bootstrap: PostgREST can't
 * execute raw SQL, so the script drives a tiny `exec_sql` helper function.
 * If the helper doesn't exist yet, the script prints the exact snippet to
 * paste into the Supabase SQL Editor once — after that, this script owns the
 * schema forever.
 */

import fs from "node:fs";
import path from "node:path";
import { INGREDIENT_DB } from "../scoring";
import { createServerClient } from "./supabase";
import { upsertIngredients, type IngredientUpsert } from "./queries";

// Scripts run via tsx don't get Next's automatic .env.local loading.
export function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

export const EXEC_SQL_BOOTSTRAP = `-- One-time bootstrap for lib/database/migrate.ts.
-- Paste into the Supabase SQL Editor and run once.
create or replace function public.exec_sql(sql text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  execute sql;
end;
$$;

-- Service role only. Nobody else gets arbitrary SQL.
revoke all on function public.exec_sql(text) from public, anon, authenticated;`;

/**
 * Splits a SQL script into individual statements, respecting single quotes,
 * dollar-quoted bodies ($$...$$ / $tag$...$tag$), and line comments. plpgsql's
 * EXECUTE runs one command at a time, so the schema must be fed statement by
 * statement.
 */
export function splitSqlStatements(sql: string): string[] {
  const statements: string[] = [];
  let current = "";
  let i = 0;
  let dollarTag: string | null = null;
  let inSingleQuote = false;
  let inLineComment = false;

  while (i < sql.length) {
    const ch = sql[i];
    const rest = sql.slice(i);

    if (inLineComment) {
      if (ch === "\n") inLineComment = false;
      current += ch;
      i += 1;
      continue;
    }
    if (dollarTag) {
      if (rest.startsWith(dollarTag)) {
        current += dollarTag;
        i += dollarTag.length;
        dollarTag = null;
      } else {
        current += ch;
        i += 1;
      }
      continue;
    }
    if (inSingleQuote) {
      current += ch;
      if (ch === "'") inSingleQuote = sql[i + 1] === "'" ? true : false;
      if (ch === "'" && sql[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      i += 1;
      continue;
    }

    if (ch === "-" && sql[i + 1] === "-") {
      inLineComment = true;
      current += ch;
      i += 1;
      continue;
    }
    if (ch === "'") {
      inSingleQuote = true;
      current += ch;
      i += 1;
      continue;
    }
    const dollarMatch = rest.match(/^\$[A-Za-z_]*\$/);
    if (dollarMatch) {
      dollarTag = dollarMatch[0];
      current += dollarTag;
      i += dollarTag.length;
      continue;
    }
    if (ch === ";") {
      const trimmed = current.trim();
      if (trimmed.length > 0) statements.push(trimmed);
      current = "";
      i += 1;
      continue;
    }
    current += ch;
    i += 1;
  }

  const tail = current.trim();
  if (tail.length > 0) statements.push(tail);
  // Drop comment-only fragments.
  return statements.filter((stmt) =>
    stmt.split("\n").some((line) => {
      const t = line.trim();
      return t.length > 0 && !t.startsWith("--");
    }),
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export interface MigrationReport {
  statementsRun: number;
  ingredientsSeeded: number;
}

export async function runMigration(): Promise<MigrationReport> {
  loadEnvLocal();
  const client = createServerClient();
  const schemaPath = path.join(process.cwd(), "lib", "database", "schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf8");

  // --- 1. Apply schema ------------------------------------------------------
  const statements = splitSqlStatements(schemaSql);
  console.log(`Applying schema: ${statements.length} statements...`);

  for (const [index, statement] of statements.entries()) {
    const { error } = await client.rpc("exec_sql", { sql: statement });
    if (error) {
      if (error.code === "PGRST202") {
        // exec_sql helper doesn't exist yet — one-time bootstrap required.
        console.error(
          "\nThe exec_sql helper is not installed on this Supabase project.\n" +
            "Paste the following into the Supabase SQL Editor " +
            "(Dashboard → SQL Editor → New query) and run it ONCE, " +
            "then re-run this script:\n\n" +
            EXEC_SQL_BOOTSTRAP +
            "\n",
        );
        throw new Error("Migration blocked: exec_sql bootstrap required");
      }
      throw new Error(
        `Schema statement ${index + 1}/${statements.length} failed: ${error.message}\n${statement.slice(0, 200)}`,
      );
    }
  }
  console.log("Schema applied.");

  // --- 2. Seed ingredients from the Score Engine ----------------------------
  console.log(`Seeding ${INGREDIENT_DB.length} ingredients from the Score Engine...`);
  const rows: IngredientUpsert[] = INGREDIENT_DB.map((entry) => ({
    slug: slugify(entry.canonicalName),
    canonical_name: entry.canonicalName,
    alternate_names: entry.alternateNames,
    category: entry.category,
    flag_level: entry.flagLevel,
    deduction_points: entry.deductionPoints,
    reason: entry.reason,
    banned_in_countries: entry.bannedInCountries ?? null,
  }));
  const seeded = await upsertIngredients(rows, client);
  console.log(`Seeded ${seeded} ingredients.`);

  // --- 3. Report ------------------------------------------------------------
  const { count, error: countError } = await client
    .from("ingredients")
    .select("*", { count: "exact", head: true });
  if (countError) throw new Error(`Post-migration count: ${countError.message}`);
  console.log(
    `Migration complete: ${statements.length} statements run, ` +
      `${count} ingredients in database.`,
  );

  return { statementsRun: statements.length, ingredientsSeeded: seeded };
}

if (typeof require !== "undefined" && require.main === module) {
  runMigration().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exit(1);
  });
}
