-- ============================================================================
-- Label Slayer database schema.
--
-- Idempotent: every statement is safe to run repeatedly. Applied by
-- lib/database/migrate.ts (which also seeds the ingredients table from the
-- Score Engine's ingredient database).
--
-- Designed for scale: 20M products, 250K ingredients. All hot lookup paths
-- (slug, barcode, category, score, verdict, full-text) are indexed.
-- ============================================================================

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- updated_at trigger: any row change stamps updated_at automatically.
-- ----------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ----------------------------------------------------------------------------
-- products
-- ----------------------------------------------------------------------------

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  brand text,
  category text,
  subcategory text,
  barcode text,
  ingredients_raw text,
  is_organic boolean not null default false,
  product_format text,
  image_url text,
  source text,
  source_id text,
  front_claims text[],
  score integer check (score >= 0 and score <= 100),
  verdict text,
  verdict_label text,
  processing_level text,
  red_flag_count integer,
  amber_flag_count integer,
  slay_headline text,
  slay_summary text,
  slay_content jsonb,
  deductions jsonb,
  status text not null default 'published'
    check (status in ('published', 'draft', 'pending-review', 'archived', 'flagged-for-review')),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('english', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('english', coalesce(brand, '')), 'B') ||
    setweight(to_tsvector('english', coalesce(ingredients_raw, '')), 'C')
  ) stored
);

-- 'flagged-for-review' was added after launch — recreate the status check so
-- databases created from the original schema pick it up. (create table if not
-- exists won't touch an existing table.)
alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('published', 'draft', 'pending-review', 'archived', 'flagged-for-review'));

-- barcode is unique but nullable — partial unique index instead of a column
-- constraint so multiple barcode-less products can coexist.
create unique index if not exists products_barcode_key
  on public.products (barcode) where barcode is not null;

create index if not exists products_category_idx on public.products (category);
create index if not exists products_score_idx on public.products (score);
create index if not exists products_verdict_idx on public.products (verdict);
create index if not exists products_status_idx on public.products (status);
create index if not exists products_brand_idx on public.products (brand);
create index if not exists products_created_at_idx on public.products (created_at);
create index if not exists products_search_idx on public.products using gin (search_vector);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- ingredients
-- ----------------------------------------------------------------------------

create table if not exists public.ingredients (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  canonical_name text unique not null,
  alternate_names text[],
  category text,
  flag_level text check (flag_level in ('red', 'amber', 'green')),
  deduction_points integer,
  reason text,
  what_it_is text,
  why_used text,
  where_found text,
  our_take text,
  why_flagged text[],
  banned_in_countries text[],
  cleaner_alternatives text,
  sources text[],
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists ingredients_flag_level_idx on public.ingredients (flag_level);
create index if not exists ingredients_category_idx on public.ingredients (category);

drop trigger if exists ingredients_set_updated_at on public.ingredients;
create trigger ingredients_set_updated_at
  before update on public.ingredients
  for each row execute function public.set_updated_at();

-- ----------------------------------------------------------------------------
-- product_ingredients (join table)
-- ----------------------------------------------------------------------------

create table if not exists public.product_ingredients (
  product_id uuid not null references public.products (id) on delete cascade,
  ingredient_id uuid not null references public.ingredients (id) on delete cascade,
  position integer not null,
  flag_level text check (flag_level in ('red', 'amber', 'green')),
  deduction_applied integer,
  primary key (product_id, ingredient_id)
);

create index if not exists product_ingredients_product_idx
  on public.product_ingredients (product_id);
create index if not exists product_ingredients_ingredient_idx
  on public.product_ingredients (ingredient_id);

-- ----------------------------------------------------------------------------
-- product_submissions
-- ----------------------------------------------------------------------------

create table if not exists public.product_submissions (
  id uuid primary key default gen_random_uuid(),
  product_name text,
  brand text,
  barcode text,
  ingredients_raw text,
  image_url text,
  submitted_by text,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected', 'duplicate', 'flagged-for-review')),
  notes text,
  created_at timestamptz not null default now()
);

-- 'flagged-for-review' rows record user "label changed" reports against
-- existing products; recreate the check for databases on the original schema.
alter table public.product_submissions drop constraint if exists product_submissions_status_check;
alter table public.product_submissions add constraint product_submissions_status_check
  check (status in ('pending', 'approved', 'rejected', 'duplicate', 'flagged-for-review'));

create index if not exists product_submissions_status_idx
  on public.product_submissions (status);
create index if not exists product_submissions_barcode_idx
  on public.product_submissions (barcode);

-- ----------------------------------------------------------------------------
-- clean_swaps
-- ----------------------------------------------------------------------------

create table if not exists public.clean_swaps (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products (id) on delete cascade,
  swap_product_id uuid not null references public.products (id) on delete cascade,
  reason text,
  created_at timestamptz not null default now(),
  unique (product_id, swap_product_id),
  check (product_id <> swap_product_id)
);

create index if not exists clean_swaps_product_idx on public.clean_swaps (product_id);

-- ----------------------------------------------------------------------------
-- Row Level Security
--
-- The service role key bypasses RLS entirely, so all pipeline writes work
-- without explicit write policies. Policies below define what the public
-- (anon key) can do.
-- ----------------------------------------------------------------------------

alter table public.products enable row level security;
alter table public.ingredients enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.product_submissions enable row level security;
alter table public.clean_swaps enable row level security;

-- Flagged products stay publicly readable: a "label changed" report queues an
-- admin re-slay, it doesn't unpublish the product.
drop policy if exists "public read published products" on public.products;
create policy "public read published products"
  on public.products for select
  to anon, authenticated
  using (status in ('published', 'flagged-for-review'));

drop policy if exists "public read ingredients" on public.ingredients;
create policy "public read ingredients"
  on public.ingredients for select
  to anon, authenticated
  using (true);

drop policy if exists "public read product_ingredients" on public.product_ingredients;
create policy "public read product_ingredients"
  on public.product_ingredients for select
  to anon, authenticated
  using (true);

drop policy if exists "anyone can submit products" on public.product_submissions;
create policy "anyone can submit products"
  on public.product_submissions for insert
  to anon, authenticated
  with check (true);
-- No select/update policy for anon on product_submissions: review queue is
-- service-role only.

drop policy if exists "public read clean_swaps" on public.clean_swaps;
create policy "public read clean_swaps"
  on public.clean_swaps for select
  to anon, authenticated
  using (true);
