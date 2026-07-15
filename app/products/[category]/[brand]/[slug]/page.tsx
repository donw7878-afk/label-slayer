/**
 * The Product Slay page — the most important template on the site. Every
 * product in the database renders through this. All content comes from the
 * stored Supabase row: score, verdict, slay_content, deductions, swaps.
 */

import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Container } from "@/components/layout/container";
import {
  Breadcrumb,
  IngredientList,
  NutritionSnapshot,
  ProcessingMeter,
  ScoreRing,
  ShareReport,
  SwapCard,
  VerdictBadge,
} from "@/components/product";
import { getCleanSwaps, getProductBySlug, type ProductRow } from "@/lib/database/queries";
import { VERDICT_TIERS } from "@/lib/constants";
import { parseIngredients } from "@/lib/scoring";
import { slugify } from "@/lib/pipeline";
import { displayNameFromSlug, productPath } from "@/lib/utils";
import type { VerdictTier } from "@/lib/types/verdict";

export const dynamic = "force-dynamic";

const PUBLIC_STATUSES = new Set(["published", "flagged-for-review"]);

type Params = Promise<{ category: string; brand: string; slug: string }>;

async function getPublicProduct(slug: string): Promise<ProductRow | null> {
  const product = await getProductBySlug(slug);
  if (!product || !PUBLIC_STATUSES.has(product.status) || !product.slay_content) {
    return null;
  }
  return product;
}

function firstSentence(text: string): string {
  const match = text.match(/^.*?[.!?](\s|$)/);
  return (match ? match[0] : text).trim();
}

// ---------------------------------------------------------------------------
// SEO metadata
// ---------------------------------------------------------------------------

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) return { title: "Product not found | The Label Slayer" };

  const title = `${product.name} by ${product.brand ?? "Unknown"} — Label Slay Score ${product.score}/100 | The Label Slayer`;
  const description = `${product.verdict_label}: ${product.slay_headline ?? ""} ${firstSentence(
    product.slay_content?.summary ?? "",
  )}`.trim();
  const canonical = productPath(product);

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title,
      description,
      url: canonical,
      type: "article",
      siteName: "The Label Slayer",
      images: product.image_url ? [{ url: product.image_url }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.image_url ? [product.image_url] : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function ProductSlayPage({ params }: { params: Params }) {
  const { category, brand, slug } = await params;
  const product = await getPublicProduct(slug);
  if (!product) notFound();

  // One canonical URL per product — wrong segments redirect to the right ones.
  const canonical = productPath(product);
  if (
    (product.category_slug ?? "uncategorized") !== category ||
    (product.brand_slug ?? "unbranded") !== brand
  ) {
    redirect(canonical);
  }

  const slay = product.slay_content!;
  const verdict = (product.verdict as VerdictTier) ?? "mid-shelf";
  const verdictDef = VERDICT_TIERS.find((t) => t.tier === verdict);
  const swaps = await getCleanSwaps(product.id);
  const reviewedDate = product.reviewed_at
    ? new Date(product.reviewed_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const flaggedIngredients = product.ingredients_raw
    ? parseIngredients(product.ingredients_raw).filter(
        (ing) => ing.matched && (ing.flagLevel === "red" || ing.flagLevel === "amber"),
      )
    : [];
  const relatedIngredients = [
    ...new Map(flaggedIngredients.map((ing) => [ing.canonicalName, ing])).values(),
  ].slice(0, 4);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    brand: { "@type": "Brand", name: product.brand ?? "Unknown" },
    ...(product.image_url ? { image: product.image_url } : {}),
    description: product.slay_headline ?? undefined,
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: product.score,
      bestRating: 100,
      worstRating: 0,
      ratingCount: 1,
    },
    review: {
      "@type": "Review",
      reviewRating: {
        "@type": "Rating",
        ratingValue: product.score,
        bestRating: 100,
        worstRating: 0,
      },
      author: { "@type": "Organization", name: "The Label Slayer" },
      reviewBody: slay.summary,
    },
  };

  return (
    <article className="py-16 md:py-24">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Container className="max-w-[1080px]">
        {/* 1. Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Home", href: "/" },
            { label: "Products", href: "/products" },
            {
              label: displayNameFromSlug(product.category_slug ?? "uncategorized"),
              href: `/products/${product.category_slug ?? "uncategorized"}`,
            },
            {
              label: product.brand ?? "Unbranded",
              href: `/products/${product.category_slug ?? "uncategorized"}/${product.brand_slug ?? "unbranded"}`,
            },
            { label: product.name },
          ]}
        />

        {/* 2. Product header */}
        <header className="mt-10 flex flex-col gap-8 md:flex-row md:items-start">
          <div className="flex h-44 w-44 shrink-0 items-center justify-center border border-dashed border-ivory/20 bg-charcoal">
            {product.image_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={product.image_url}
                alt={product.name}
                className="h-full w-full object-contain p-3"
              />
            ) : (
              <span className="px-4 text-center text-[10px] uppercase tracking-[0.2em] text-brand-muted">
                Product image
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h1 className="text-[clamp(30px,4vw,48px)] leading-[1.02] font-extrabold tracking-[-0.01em] uppercase">
              {product.name}
            </h1>
            <p className="mt-2 text-[13px] font-semibold uppercase tracking-[0.18em] text-ivory-dim">
              {product.brand ?? "Unknown brand"}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="bg-charcoal px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.16em] text-ivory">
                {displayNameFromSlug(product.category_slug ?? "uncategorized")}
              </span>
              {reviewedDate && (
                <span className="text-[11px] tracking-[0.06em] text-brand-muted">
                  Reviewed {reviewedDate}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* 3. Score block */}
        <section className="mt-12 border border-hairline bg-charcoal p-8 md:p-10">
          <div className="flex flex-col items-center gap-6 text-center md:flex-row md:gap-10 md:text-left">
            <ScoreRing score={product.score ?? 0} verdict={verdict} size="lg" />
            <div className="min-w-0">
              <VerdictBadge tier={verdict} className="px-5 py-2 text-[12px]" />
              {product.slay_headline && (
                <p className="editorial mt-4 text-[clamp(22px,2.8vw,32px)] leading-snug text-brass-bright">
                  “{product.slay_headline}”
                </p>
              )}
            </div>
          </div>
        </section>

        {/* 4. The Slay */}
        <section className="relative mt-16">
          <div className="mb-6 md:hidden">
            <Image
              src="/assets/character-hero.png"
              alt="The Label Slayer"
              width={280}
              height={280}
              className="mx-auto h-36 w-auto"
            />
          </div>
          <div className="relative border-l-2 border-brass bg-charcoal-2 p-8 md:p-12 lg:pr-64">
            <span className="eyebrow">The Slay</span>
            <div className="mt-6 max-w-[62ch] space-y-5 text-[16px] leading-[1.8] text-ivory">
              {slay.summary.split("\n\n").map((paragraph, i) => (
                <p key={`summary-${i}`}>{paragraph}</p>
              ))}
            </div>
            <h2 className="mt-10 mb-5 text-[13px] font-bold uppercase tracking-[0.2em] text-ivory-dim">
              Why This Score
            </h2>
            <div className="max-w-[62ch] space-y-5 text-[15px] leading-[1.8] text-ivory-dim">
              {slay.whyThisScore.split("\n\n").map((paragraph, i) => (
                <p key={`why-${i}`} className="[&:has(strong)]:text-ivory">
                  {paragraph}
                </p>
              ))}
            </div>
            {slay.finalWord && (
              <p className="editorial mt-10 border-t border-hairline pt-6 text-[20px] leading-snug text-brass-bright">
                “{slay.finalWord}”
              </p>
            )}
            <Image
              src="/assets/character-hero.png"
              alt=""
              aria-hidden
              width={280}
              height={280}
              className="pointer-events-none absolute -right-6 bottom-0 hidden h-[240px] w-auto lg:block"
            />
          </div>
        </section>

        {/* 5. Marketing Says vs Label Says */}
        <section className="mt-16">
          <span className="eyebrow">The front vs the back</span>
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <SwapCard
              variant="bad"
              label="Marketing Says"
              name={product.front_claims?.length ? product.front_claims.map((c) => `“${c}”`).join(" · ") : "The pitch"}
              summary={slay.marketingSays}
            />
            <SwapCard
              variant="good"
              label="Label Says"
              name="The receipts"
              summary={slay.labelSays}
            />
          </div>
        </section>

        {/* 6. Ingredient breakdown */}
        {product.ingredients_raw && (
          <section className="mt-16">
            <span className="eyebrow">Ingredient breakdown</span>
            <div className="mt-6">
              <IngredientList ingredientsRaw={product.ingredients_raw} />
            </div>
          </section>
        )}

        {/* 7. Red flags */}
        {slay.redFlagBreakdown.length > 0 && (
          <section className="mt-16">
            <span className="eyebrow">Red flags</span>
            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
              {slay.redFlagBreakdown.map((flag) => (
                <div
                  key={flag.ingredient}
                  className="border-l-2 border-ember bg-charcoal p-6"
                >
                  <h3 className="mb-2 text-[14px] font-bold normal-case text-ivory">
                    {flag.ingredient}
                  </h3>
                  <p className="text-[13px] leading-relaxed text-ivory-dim">{flag.roast}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* 8. Processing level */}
        <section className="mt-16">
          <span className="eyebrow">Processing level</span>
          <div className="mt-6">
            <ProcessingMeter level={product.processing_level} />
            <p className="mt-5 max-w-[62ch] text-[15px] leading-relaxed text-ivory-dim">
              {slay.processingVerdict}
            </p>
          </div>
        </section>

        {/* 9. Scoring system reference */}
        <section className="mt-16">
          <span className="eyebrow">How we score</span>
          <div className="mt-6 max-w-[860px] overflow-hidden border border-hairline">
            <Image
              src="/assets/Scoring-System-Chart.png"
              alt="The Label Slayer scoring system chart"
              width={1536}
              height={1024}
              className="h-auto w-full object-contain"
            />
          </div>
          <div className="mt-5 flex max-w-[860px] flex-wrap gap-2">
            {VERDICT_TIERS.map((tier) => {
              const active = tier.tier === verdict;
              return (
                <div
                  key={tier.tier}
                  className="flex items-center gap-2.5 border-l-2 py-2.5 pr-4 pl-3.5"
                  style={{
                    borderColor: tier.color,
                    backgroundColor: active ? `${tier.color}1f` : "#17171c",
                    outline: active ? `1px solid ${tier.color}66` : "none",
                  }}
                >
                  <span
                    className="text-xs font-extrabold tracking-[0.05em]"
                    style={{ color: tier.color }}
                  >
                    {tier.scoreMin}–{tier.scoreMax}
                  </span>
                  <span
                    className="text-[12px] font-bold tracking-[0.08em] uppercase"
                    style={{ color: tier.color }}
                  >
                    {tier.label}
                  </span>
                </div>
              );
            })}
          </div>
          <Link
            href="/methodology"
            className="mt-5 inline-block text-[12px] font-semibold uppercase tracking-[0.12em] text-brass transition-colors hover:text-brass-bright"
          >
            See our full scoring methodology →
          </Link>
        </section>

        {/* 10. Clean swaps */}
        <section className="mt-16">
          <span className="eyebrow">Clean swaps</span>
          <h2 className="mt-3 text-[22px] font-bold normal-case">
            Better choices that earned their score
          </h2>
          <p className="mt-3 max-w-[62ch] text-[15px] leading-relaxed text-ivory-dim">
            {slay.cleanSwapIntro}
          </p>
          {swaps.length > 0 ? (
            <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {swaps.slice(0, 3).map((swap) => (
                <Link key={swap.id} href={productPath(swap.swap_product)} className="block">
                  <SwapCard
                    variant="good"
                    label={`${swap.swap_product.score}/100 — ${swap.swap_product.verdict_label ?? ""}`}
                    name={swap.swap_product.name}
                    summary={swap.swap_product.slay_headline ?? swap.reason ?? ""}
                  />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-6 border border-hairline bg-charcoal px-6 py-5 text-[14px] text-brand-muted">
              No swaps in this category yet — we&apos;re slaying more products every day.
            </p>
          )}
        </section>

        {/* 11. Nutritional snapshot */}
        {product.nutrition_data && (
          <section className="mt-16">
            <span className="eyebrow">Nutritional snapshot</span>
            <div className="mt-6 max-w-[720px]">
              <NutritionSnapshot data={product.nutrition_data} />
            </div>
          </section>
        )}

        {/* 12. Related content */}
        {relatedIngredients.length > 0 && (
          <section className="mt-16">
            <span className="eyebrow">Related ingredients</span>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {relatedIngredients.map((ing) => (
                <Link
                  key={ing.canonicalName}
                  href={`/ingredients/${slugify(ing.canonicalName)}`}
                  className="group border border-hairline bg-charcoal p-5 transition-colors hover:border-brass/50"
                >
                  <span
                    aria-hidden
                    className="mb-3 inline-block h-2 w-2 rounded-full"
                    style={{
                      backgroundColor: ing.flagLevel === "red" ? "#E0472E" : "#D08A3E",
                    }}
                  />
                  <h3 className="text-[14px] font-bold normal-case text-ivory transition-colors group-hover:text-brass-bright">
                    {ing.canonicalName}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-brand-muted">
                    {ing.reason}
                  </p>
                </Link>
              ))}
            </div>
            <div className="mt-8">
              <span className="eyebrow">Related articles</span>
              <p className="mt-4 border border-dashed border-ivory/15 bg-charcoal px-6 py-5 text-[13px] text-brand-muted">
                Deep dives on these ingredients are coming to the blog.
              </p>
            </div>
          </section>
        )}

        {/* 13. Share & report */}
        <section className="mt-16 border-t border-hairline pt-8">
          <ShareReport
            slug={product.slug}
            productName={product.name}
            headline={product.slay_headline}
          />
        </section>

        {/* 14. Disclaimer */}
        <footer className="mt-10 max-w-[70ch] text-[12px] leading-relaxed text-brand-muted">
          <p>
            Scores reflect our published{" "}
            <Link href="/methodology" className="underline hover:text-ivory-dim">
              methodology
            </Link>
            . We don&apos;t provide medical advice. Formulations change — always verify
            the label on the product you purchase. Read about our{" "}
            <Link href="/independence" className="underline hover:text-ivory-dim">
              independence
            </Link>
            .
          </p>
          {verdictDef && (
            <p className="mt-2">
              {verdictDef.label} ({verdictDef.scoreMin}–{verdictDef.scoreMax}):{" "}
              {verdictDef.description}
            </p>
          )}
        </footer>
      </Container>
    </article>
  );
}
