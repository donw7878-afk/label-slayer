"use client";

/**
 * The product database search — the hybrid search experience.
 *
 * Slayed products (already in Supabase) render as full SlayCards. External
 * matches that haven't been scored yet land in "Not Yet Slayed" with two
 * actions: an instant Score Engine preview (free) and a full-slay request
 * (runs the pipeline, saves as pending-review for admin sign-off).
 */

import { useState } from "react";
import Link from "next/link";
import { Container } from "@/components/layout/container";
import { SlayCard } from "@/components/product";
import type { VerdictTier } from "@/lib/types/verdict";

interface SlayedResult {
  slug: string;
  name: string;
  brand: string | null;
  score: number | null;
  verdict: string | null;
  verdict_label: string | null;
  slay_headline: string | null;
  slay_summary: string | null;
}

interface UnslayedResult {
  name: string;
  brand: string | null;
  barcode: string | null;
  ingredients_raw: string | null;
  source: string;
  sourceId: string | null;
  category: string | null;
  subcategory: string | null;
  imageUrl: string | null;
  isOrganic: boolean;
}

interface PreviewResult {
  score: number;
  verdictLabel: string;
  processingLevel: string;
  redFlagCount: number;
  amberFlagCount: number;
}

interface QueuedResult {
  score: number | null;
  verdictLabel: string | null;
}

const SOURCE_LABELS: Record<string, string> = {
  usda: "USDA",
  openfoodfacts: "Open Food Facts",
  openbeautyfacts: "Open Beauty Facts",
};

function itemKey(item: UnslayedResult): string {
  return item.barcode ?? `${item.source}:${item.sourceId ?? item.name}`;
}

export default function ProductsPage() {
  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [slayed, setSlayed] = useState<SlayedResult[]>([]);
  const [unslayed, setUnslayed] = useState<UnslayedResult[]>([]);

  const [previews, setPreviews] = useState<Record<string, PreviewResult>>({});
  const [previewing, setPreviewing] = useState<string | null>(null);
  const [queued, setQueued] = useState<Record<string, QueuedResult>>({});
  const [requesting, setRequesting] = useState<string | null>(null);
  const [actionError, setActionError] = useState("");

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    if (!q) return;
    setSearching(true);
    setError("");
    setActionError("");
    try {
      const isBarcode = /^\d{8,14}$/.test(q);
      const res = await fetch(
        `/api/products/search?${isBarcode ? "barcode" : "q"}=${encodeURIComponent(q)}`,
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Search failed (${res.status})`);
      setSlayed(data.slayed ?? []);
      setUnslayed(data.unslayed ?? []);
      setSearched(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handlePreview(item: UnslayedResult) {
    const key = itemKey(item);
    setPreviewing(key);
    setActionError("");
    try {
      const res = await fetch("/api/products/preview", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ingredientsRaw: item.ingredients_raw,
          isOrganic: item.isOrganic,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Preview failed (${res.status})`);
      setPreviews((prev) => ({ ...prev, [key]: data }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Preview failed");
    } finally {
      setPreviewing(null);
    }
  }

  async function handleRequestSlay(item: UnslayedResult) {
    const key = itemKey(item);
    setRequesting(key);
    setActionError("");
    try {
      const res = await fetch("/api/products/request-slay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: item.name,
          brand: item.brand ?? undefined,
          category: item.category ?? undefined,
          subcategory: item.subcategory ?? undefined,
          barcode: item.barcode ?? undefined,
          ingredientsRaw: item.ingredients_raw,
          isOrganic: item.isOrganic,
          imageUrl: item.imageUrl ?? undefined,
          source: item.source,
          sourceId: item.sourceId ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Request failed (${res.status})`);
      setQueued((prev) => ({
        ...prev,
        [key]: { score: data.score, verdictLabel: data.verdictLabel },
      }));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setRequesting(null);
    }
  }

  return (
    <section className="py-24 md:py-32">
      <Container>
        <span className="eyebrow">The database</span>
        <h1 className="mt-4 mb-5 text-[clamp(34px,4.5vw,54px)] leading-[1.04] tracking-[-0.015em]">
          Search the slays
        </h1>
        <p className="mb-10 max-w-[640px] text-[17px] leading-relaxed text-ivory-dim">
          Every product gets the same treatment: ingredient analysis, processing
          level, red flags, and a verdict you can actually understand.
        </p>

        <form
          className="mb-4 flex max-w-[720px] border border-ivory/20 bg-obsidian"
          onSubmit={handleSearch}
        >
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search any product or scan a barcode — Oreos, Cheerios, 028400443685…"
            className="min-w-0 flex-1 bg-transparent px-4 py-4 text-base text-ivory placeholder:text-brand-muted focus:outline-none md:px-6 md:py-5"
          />
          <button
            type="submit"
            disabled={searching}
            className="bg-ivory px-5 text-xs font-bold tracking-[0.12em] text-obsidian uppercase transition-colors hover:bg-brass-bright disabled:opacity-60 md:px-8"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>

        {error && <p className="mb-6 text-sm text-ember">{error}</p>}
        {actionError && <p className="mb-6 text-sm text-ember">{actionError}</p>}

        {searched && slayed.length === 0 && unslayed.length === 0 && !error && (
          <p className="py-12 text-ivory-dim">
            Nothing found for “{query}”. Submit the product and we&apos;ll slay it.
          </p>
        )}

        {/* Slayed results */}
        {slayed.length > 0 && (
          <div className="mt-10">
            <h2 className="eyebrow mb-5">Slayed</h2>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {slayed.map((p) => (
                <Link key={p.slug} href={`/products/${p.slug}`} className="block">
                  <SlayCard
                    name={p.name}
                    brand={p.brand ?? undefined}
                    score={p.score ?? 0}
                    verdict={(p.verdict as VerdictTier) ?? "mid-shelf"}
                    summary={p.slay_headline ?? p.slay_summary ?? ""}
                  />
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Unslayed results */}
        {unslayed.length > 0 && (
          <div className="mt-14">
            <h2 className="eyebrow mb-2">Not Yet Slayed</h2>
            <p className="mb-5 max-w-[640px] text-sm text-ivory-dim">
              Found in external databases but not scored yet. Preview the score
              instantly, or request the full slay.
            </p>
            <ul className="max-w-[860px] divide-y divide-hairline border border-hairline bg-charcoal">
              {unslayed.map((item) => {
                const key = itemKey(item);
                const preview = previews[key];
                const queuedItem = queued[key];
                const hasIngredients = Boolean(item.ingredients_raw);
                return (
                  <li key={key} className="p-5 md:p-6">
                    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                      <div className="min-w-0">
                        <h3 className="text-[16px] font-bold normal-case">{item.name}</h3>
                        <p className="mt-0.5 text-xs uppercase tracking-[0.08em] text-brand-muted">
                          {item.brand ?? "Unknown brand"}
                          <span className="mx-2 text-hairline">·</span>
                          via {SOURCE_LABELS[item.source] ?? item.source}
                        </p>
                      </div>
                      {preview && !queuedItem && (
                        <div className="shrink-0 border border-hairline px-4 py-2 text-sm">
                          <span className="font-bold text-ivory">{preview.score}/100</span>
                          <span className="text-ivory-dim"> — {preview.verdictLabel}</span>
                          <span className="ml-2 text-xs text-brand-muted">
                            {preview.redFlagCount} red · {preview.amberFlagCount} amber
                          </span>
                        </div>
                      )}
                    </div>

                    {queuedItem ? (
                      <p className="mt-3 border border-hairline bg-obsidian px-4 py-3 text-sm text-ivory-dim">
                        Queued — Score:{" "}
                        <span className="font-bold text-ivory">{queuedItem.score}</span>,{" "}
                        {queuedItem.verdictLabel}. Full slay coming soon.
                      </p>
                    ) : hasIngredients ? (
                      <div className="mt-4 flex flex-wrap gap-2.5">
                        {!preview && (
                          <button
                            onClick={() => handlePreview(item)}
                            disabled={previewing !== null || requesting !== null}
                            className="border border-hairline px-4 py-2 text-xs tracking-[0.04em] text-ivory-dim transition-colors hover:border-brass hover:text-brass-bright disabled:opacity-50"
                          >
                            {previewing === key ? "Scoring…" : "Preview Score"}
                          </button>
                        )}
                        <button
                          onClick={() => handleRequestSlay(item)}
                          disabled={previewing !== null || requesting !== null}
                          className="bg-ivory px-4 py-2 text-xs font-bold tracking-[0.08em] text-obsidian uppercase transition-colors hover:bg-brass-bright disabled:opacity-50"
                        >
                          {requesting === key ? "Slaying… (takes ~20s)" : "Request Full Slay"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-3 text-sm text-brand-muted">
                        No ingredient list on record — submit the label and we&apos;ll
                        take it from there.
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </Container>
    </section>
  );
}
