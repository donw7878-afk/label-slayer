/**
 * The product database — main entry point. Hybrid search up top, then the
 * browsable category grid and the Recently Slayed / Top Rated / Worst
 * Offenders rails, all pulled live from Supabase.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SlayCard } from "@/components/product";
import { ProductSearch } from "@/components/product/product-search";
import { BROWSE_CATEGORIES } from "@/lib/constants";
import {
  getProductRail,
  getPublishedProductCount,
  type ProductRow,
} from "@/lib/database/queries";
import { productPath } from "@/lib/utils";
import type { VerdictTier } from "@/lib/types/verdict";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Product Database — Search the Slays | The Label Slayer",
  description:
    "Search thousands of products scored 0–100 against the ingredient label. No brand influence, no pay-to-play — just the label.",
  alternates: { canonical: "/products" },
};

function ProductRail({ title, products }: { title: string; products: ProductRow[] }) {
  if (products.length === 0) return null;
  return (
    <div className="mt-16">
      <h2 className="eyebrow mb-5">{title}</h2>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
    </div>
  );
}

export default async function ProductsPage() {
  const [count, recent, top, worst] = await Promise.all([
    getPublishedProductCount(),
    getProductRail("recent", 6),
    getProductRail("top", 3),
    getProductRail("worst", 3),
  ]);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <span className="eyebrow">The database</span>
        <h1 className="mt-4 mb-5 text-[clamp(34px,4.5vw,54px)] leading-[1.04] tracking-[-0.015em]">
          Search the slays
        </h1>
        <p className="mb-3 max-w-[640px] text-[17px] leading-relaxed text-ivory-dim">
          Every product gets the same treatment: ingredient analysis, processing
          level, red flags, and a verdict you can actually understand.
        </p>
        <p className="mb-10 text-[13px] font-semibold uppercase tracking-[0.14em] text-brass">
          {count} product{count === 1 ? "" : "s"} slayed and counting
        </p>

        <ProductSearch />

        {/* Category grid */}
        <div className="mt-20">
          <h2 className="eyebrow mb-5">Browse by category</h2>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
            {BROWSE_CATEGORIES.map((category) => (
              <Link
                key={category.slug}
                href={`/products/${category.slug}`}
                className="group border border-hairline bg-charcoal p-5 transition-colors hover:border-brass/50"
              >
                <h3 className="text-[15px] font-bold normal-case text-ivory transition-colors group-hover:text-brass-bright">
                  {category.name}
                </h3>
                <p className="mt-1.5 line-clamp-2 text-[12px] leading-relaxed text-brand-muted">
                  {category.description}
                </p>
              </Link>
            ))}
          </div>
        </div>

        <ProductRail title="Recently Slayed" products={recent} />
        <ProductRail title="Top Rated" products={top} />
        <ProductRail title="Worst Offenders" products={worst} />
      </Container>
    </section>
  );
}
