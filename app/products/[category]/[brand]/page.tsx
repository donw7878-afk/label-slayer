/**
 * Brand index — /products/[category]/[brand]. Every product from one brand
 * within a category, with the brand's average score front and center.
 */

import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Container } from "@/components/layout/container";
import { Breadcrumb, ScoreRing, SlayCard } from "@/components/product";
import { getProductsForBrandPage } from "@/lib/database/queries";
import { getVerdictByScore } from "@/lib/constants";
import { displayNameFromSlug, productPath } from "@/lib/utils";
import type { VerdictTier } from "@/lib/types/verdict";

export const dynamic = "force-dynamic";

type Params = Promise<{ category: string; brand: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { category, brand } = await params;
  const products = await getProductsForBrandPage(category, brand);
  const brandName = products[0]?.brand ?? displayNameFromSlug(brand);
  return {
    title: `${brandName} Products Rated | The Label Slayer`,
    description: `${brandName} ${displayNameFromSlug(category).toLowerCase()} products scored 0–100 against the ingredient label.`,
    alternates: { canonical: `/products/${category}/${brand}` },
  };
}

export default async function BrandPage({ params }: { params: Params }) {
  const { category, brand } = await params;
  const products = await getProductsForBrandPage(category, brand);
  if (products.length === 0) notFound();

  const brandName = products[0].brand ?? displayNameFromSlug(brand);
  const categoryName = displayNameFromSlug(category);
  const scores = products
    .map((p) => p.score)
    .filter((s): s is number => typeof s === "number");
  const avgScore = Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length);
  const avgVerdict = getVerdictByScore(avgScore);

  return (
    <section className="py-16 md:py-24">
      <Container>
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            { label: categoryName, href: `/products/${category}` },
            { label: brandName },
          ]}
        />
        <div className="mt-8 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-[clamp(30px,4vw,48px)] leading-[1.04] tracking-[-0.015em]">
              {brandName}{" "}
              <span className="text-brass">{categoryName} — Label Slayer Scores</span>
            </h1>
            <p className="mt-4 max-w-[600px] text-[16px] leading-relaxed text-ivory-dim">
              {products.length} {brandName} product{products.length === 1 ? "" : "s"}{" "}
              scored against the label.
            </p>
          </div>
          <div className="flex shrink-0 items-center gap-4 border border-hairline bg-charcoal px-6 py-5">
            <ScoreRing score={avgScore} verdict={avgVerdict.tier} />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-brand-muted">
                Brand average
              </p>
              <p
                className="mt-1 text-[13px] font-bold uppercase tracking-[0.08em]"
                style={{ color: avgVerdict.color }}
              >
                {avgVerdict.label}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
      </Container>
    </section>
  );
}
