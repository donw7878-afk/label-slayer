/**
 * Category index — /products/[category]. All products in one category with
 * sort and verdict-tier filters (link-driven, no client JS needed).
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Breadcrumb, SlayCard } from "@/components/product";
import { BROWSE_CATEGORIES, VERDICT_TIERS } from "@/lib/constants";
import {
  getProductsForCategoryPage,
  type ProductSort,
} from "@/lib/database/queries";
import { displayNameFromSlug, productPath } from "@/lib/utils";
import type { VerdictTier } from "@/lib/types/verdict";

export const dynamic = "force-dynamic";

const PAGE_SIZE = 24;

type Params = Promise<{ category: string }>;
type SearchParams = Promise<{ sort?: string; verdict?: string; page?: string }>;

function categoryMeta(slug: string) {
  const known = BROWSE_CATEGORIES.find((c) => c.slug === slug);
  return {
    name: known?.name ?? displayNameFromSlug(slug),
    description:
      known?.description ??
      "Every product in this category, scored against the label — not the marketing.",
  };
}

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category } = await params;
  const { name } = categoryMeta(category);
  return {
    title: `${name} Products Rated & Reviewed | The Label Slayer`,
    description: `${name} products scored 0–100 against the ingredient label. No brand influence, no pay-to-play.`,
    alternates: { canonical: `/products/${category}` },
  };
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Params;
  searchParams: SearchParams;
}) {
  const { category } = await params;
  const { sort: sortParam, verdict, page: pageParam } = await searchParams;
  const sort: ProductSort =
    sortParam === "score-asc" || sortParam === "newest" ? sortParam : "score-desc";
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const { name, description } = categoryMeta(category);

  const products = await getProductsForCategoryPage(category, {
    sort,
    verdict: verdict || undefined,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });

  const baseQuery = (overrides: Record<string, string | undefined>) => {
    const merged = { sort: sortParam, verdict, ...overrides };
    const qs = Object.entries(merged)
      .filter(([, v]) => v)
      .map(([k, v]) => `${k}=${encodeURIComponent(v!)}`)
      .join("&");
    return qs ? `/products/${category}?${qs}` : `/products/${category}`;
  };

  const sortChips: Array<{ label: string; value: ProductSort }> = [
    { label: "Score: high to low", value: "score-desc" },
    { label: "Score: low to high", value: "score-asc" },
    { label: "Newest", value: "newest" },
  ];

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: name },
          ]}
        />
        <h1 className="mt-8 text-[clamp(30px,4vw,48px)] leading-[1.04] tracking-[-0.015em]">
          {name} Products <span className="text-brass">— Label Slayer Scores</span>
        </h1>
        <p className="mt-4 max-w-[640px] text-[16px] leading-relaxed text-ivory-dim">
          {description}
        </p>

        {/* Filter bar */}
        <div className="mt-10 flex flex-wrap items-center gap-2 border-y border-hairline py-4">
          {sortChips.map((chip) => (
            <Link
              key={chip.value}
              href={baseQuery({ sort: chip.value, page: undefined })}
              className={`px-3.5 py-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] transition-colors ${
                sort === chip.value
                  ? "bg-ivory text-obsidian"
                  : "border border-hairline text-ivory-dim hover:border-brass hover:text-brass-bright"
              }`}
            >
              {chip.label}
            </Link>
          ))}
          <span className="mx-2 hidden h-4 w-px bg-hairline sm:block" />
          {VERDICT_TIERS.map((tier) => (
            <Link
              key={tier.tier}
              href={baseQuery({
                verdict: verdict === tier.tier ? undefined : tier.tier,
                page: undefined,
              })}
              className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.1em] transition-opacity hover:opacity-80"
              style={{
                color: tier.color,
                backgroundColor: verdict === tier.tier ? `${tier.color}2b` : "transparent",
                border: `1px solid ${verdict === tier.tier ? tier.color : "rgba(242,238,230,0.09)"}`,
              }}
            >
              {tier.label}
            </Link>
          ))}
        </div>

        {/* Grid */}
        {products.length === 0 ? (
          <p className="py-16 text-ivory-dim">
            {page > 1
              ? "No more products on this page."
              : "No products slayed in this category yet — we're slaying more every day."}
          </p>
        ) : (
          <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Link key={product.id} href={productPath(product)} className="block">
                <SlayCard
                  name={product.name}
                  brand={product.brand ?? undefined}
                  score={product.score ?? 0}
                  verdict={(product.verdict as VerdictTier) ?? "mid-shelf"}
                  summary={product.slay_headline ?? product.slay_summary ?? ""}
                />
              </Link>
            ))}
          </div>
        )}

        {/* Pagination */}
        <div className="mt-12 flex items-center gap-4">
          {page > 1 && (
            <Link
              href={baseQuery({ page: String(page - 1) })}
              className="border border-hairline px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-brass hover:text-brass-bright"
            >
              ← Previous
            </Link>
          )}
          {products.length === PAGE_SIZE && (
            <Link
              href={baseQuery({ page: String(page + 1) })}
              className="border border-hairline px-5 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-brass hover:text-brass-bright"
            >
              Load more →
            </Link>
          )}
        </div>
      </Container>
    </section>
  );
}
