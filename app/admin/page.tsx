"use client";

/**
 * Internal admin console for re-slaying products. Deliberately plain — this
 * never ships to users. The password IS the ADMIN_SECRET; it's held in
 * sessionStorage and sent as x-admin-secret on every request, and every admin
 * API route verifies it server-side.
 */

import { useCallback, useEffect, useState } from "react";

interface AdminProduct {
  id: string;
  slug: string;
  name: string;
  name_raw: string | null;
  brand: string | null;
  category: string | null;
  score: number | null;
  verdict: string | null;
  verdict_label: string | null;
  slay_headline: string | null;
  status: string;
  reviewed_at: string | null;
  ingredients_raw: string | null;
}

interface FlaggedSubmission {
  id: string;
  product_name: string | null;
  brand: string | null;
  barcode: string | null;
  notes: string | null;
  created_at: string;
}

interface ReslaySnapshot {
  score: number | null;
  verdict: string | null;
  verdictLabel: string | null;
  headline: string | null;
  reviewedAt: string | null;
}

interface ReslayResult {
  slug: string;
  name: string;
  ingredientsUpdated: boolean;
  before: ReslaySnapshot;
  after: ReslaySnapshot;
}

const SECRET_KEY = "label-slayer-admin-secret";

function formatDate(iso: string | null): string {
  if (!iso) return "never";
  return new Date(iso).toLocaleString();
}

export default function AdminPage() {
  const [secret, setSecret] = useState("");
  const [authed, setAuthed] = useState(false);
  const [loginError, setLoginError] = useState("");

  const [query, setQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [products, setProducts] = useState<AdminProduct[]>([]);

  const [flagged, setFlagged] = useState<FlaggedSubmission[]>([]);

  const [ingredientsBySlug, setIngredientsBySlug] = useState<Record<string, string>>({});
  const [reslayingSlug, setReslayingSlug] = useState<string | null>(null);
  const [reslayError, setReslayError] = useState("");
  const [reslayResult, setReslayResult] = useState<ReslayResult | null>(null);

  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [editedName, setEditedName] = useState("");
  const [savingName, setSavingName] = useState(false);
  const [renameError, setRenameError] = useState("");

  const adminFetch = useCallback(
    (path: string, init: RequestInit = {}, key = secret) =>
      fetch(path, {
        ...init,
        headers: { ...init.headers, "x-admin-secret": key },
      }),
    [secret],
  );

  const loadFlagged = useCallback(
    async (key = secret) => {
      const res = await adminFetch("/api/admin/flagged", {}, key);
      if (!res.ok) return false;
      const data = await res.json();
      setFlagged(data.flagged ?? []);
      return true;
    },
    [adminFetch, secret],
  );

  // Resume a session: reuse the stored secret if it still checks out.
  useEffect(() => {
    const stored = sessionStorage.getItem(SECRET_KEY);
    if (!stored) return;
    loadFlagged(stored).then((ok) => {
      if (ok) {
        setSecret(stored);
        setAuthed(true);
      } else {
        sessionStorage.removeItem(SECRET_KEY);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError("");
    const ok = await loadFlagged(secret);
    if (ok) {
      sessionStorage.setItem(SECRET_KEY, secret);
      setAuthed(true);
    } else {
      setLoginError("Wrong password.");
    }
  }

  async function handleSearch(e?: React.FormEvent, overrideQuery?: string) {
    e?.preventDefault();
    const q = (overrideQuery ?? query).trim();
    if (!q) return;
    setSearching(true);
    setSearchError("");
    try {
      const res = await adminFetch(`/api/admin/search?q=${encodeURIComponent(q)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Search failed (${res.status})`);
      setProducts(data.products ?? []);
      if ((data.products ?? []).length === 0) setSearchError(`No products match "${q}".`);
    } catch (err) {
      setSearchError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setSearching(false);
    }
  }

  async function handleRename(product: AdminProduct) {
    const newName = editedName.trim();
    if (!newName || newName === product.name) {
      setEditingSlug(null);
      return;
    }
    setSavingName(true);
    setRenameError("");
    try {
      const res = await adminFetch("/api/admin/rename", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: product.slug, newName }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Rename failed (${res.status})`);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === product.id
            ? { ...p, name: data.product.name, slug: data.product.slug }
            : p,
        ),
      );
      setEditingSlug(null);
    } catch (err) {
      setRenameError(err instanceof Error ? err.message : "Rename failed");
    } finally {
      setSavingName(false);
    }
  }

  async function handleReslay(product: AdminProduct) {
    setReslayingSlug(product.slug);
    setReslayError("");
    setReslayResult(null);
    try {
      const ingredientsRaw = ingredientsBySlug[product.slug]?.trim();
      const res = await adminFetch("/api/admin/reslay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug: product.slug,
          ...(ingredientsRaw ? { ingredientsRaw } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? `Re-slay failed (${res.status})`);
      setReslayResult(data);
      setIngredientsBySlug((prev) => ({ ...prev, [product.slug]: "" }));
      // Refresh what changed: the product row and the flag queue.
      await Promise.all([handleSearch(undefined, query || product.slug), loadFlagged()]);
    } catch (err) {
      setReslayError(err instanceof Error ? err.message : "Re-slay failed");
    } finally {
      setReslayingSlug(null);
    }
  }

  if (!authed) {
    return (
      <main className="mx-auto max-w-sm px-4 py-24">
        <h1 className="mb-6 text-xl font-bold">Label Slayer Admin</h1>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Admin password"
            className="w-full rounded border border-neutral-400 px-3 py-2"
            autoFocus
          />
          <button
            type="submit"
            className="w-full rounded bg-black px-3 py-2 font-semibold text-white"
          >
            Enter
          </button>
          {loginError && <p className="text-sm text-red-600">{loginError}</p>}
        </form>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl space-y-10 px-4 py-12">
      <header className="flex items-baseline justify-between">
        <h1 className="text-2xl font-bold">Label Slayer Admin</h1>
        <span className="text-sm text-neutral-500">internal tooling</span>
      </header>

      {/* Search */}
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Re-Slay a product</h2>
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, brand, or slug"
            className="flex-1 rounded border border-neutral-400 px-3 py-2"
          />
          <button
            type="submit"
            disabled={searching}
            className="rounded bg-black px-4 py-2 font-semibold text-white disabled:opacity-50"
          >
            {searching ? "Searching…" : "Search"}
          </button>
        </form>
        {searchError && <p className="text-sm text-red-600">{searchError}</p>}

        <ul className="space-y-4">
          {products.map((p) => (
            <li key={p.id} className="rounded border border-neutral-300 p-4">
              <div className="flex items-baseline justify-between gap-2">
                <div className="min-w-0 flex-1">
                  {editingSlug === p.slug ? (
                    <span className="flex items-center gap-2">
                      <input
                        value={editedName}
                        onChange={(e) => setEditedName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(p);
                          if (e.key === "Escape") setEditingSlug(null);
                        }}
                        className="flex-1 rounded border border-neutral-400 px-2 py-1 font-semibold"
                        autoFocus
                      />
                      <button
                        onClick={() => handleRename(p)}
                        disabled={savingName}
                        className="rounded bg-black px-3 py-1 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        {savingName ? "Saving…" : "Save"}
                      </button>
                      <button
                        onClick={() => setEditingSlug(null)}
                        className="text-sm text-neutral-500 underline"
                      >
                        Cancel
                      </button>
                    </span>
                  ) : (
                    <span>
                      <span className="font-semibold">{p.name}</span>
                      <button
                        onClick={() => {
                          setEditingSlug(p.slug);
                          setEditedName(p.name);
                          setRenameError("");
                        }}
                        className="ml-2 text-sm text-blue-700 underline"
                      >
                        Edit
                      </button>
                      {p.brand && <span className="text-neutral-500"> — {p.brand}</span>}
                      <span className="ml-2 text-xs text-neutral-400">{p.slug}</span>
                    </span>
                  )}
                  {p.name_raw && p.name_raw !== p.name && (
                    <p className="mt-0.5 text-xs text-neutral-400">
                      Raw API name: {p.name_raw}
                    </p>
                  )}
                  {editingSlug === p.slug && renameError && (
                    <p className="mt-1 text-sm text-red-600">{renameError}</p>
                  )}
                </div>
                {p.status !== "published" && (
                  <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                    {p.status}
                  </span>
                )}
              </div>
              <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-neutral-500">Score</dt>
                  <dd className="font-semibold">{p.score ?? "—"}</dd>
                </div>
                <div>
                  <dt className="text-neutral-500">Verdict</dt>
                  <dd>{p.verdict_label ?? p.verdict ?? "—"}</dd>
                </div>
                <div className="col-span-2">
                  <dt className="text-neutral-500">Reviewed</dt>
                  <dd>{formatDate(p.reviewed_at)}</dd>
                </div>
              </dl>
              {p.slay_headline && (
                <p className="mt-2 text-sm italic text-neutral-700">
                  “{p.slay_headline}”
                </p>
              )}
              <textarea
                value={ingredientsBySlug[p.slug] ?? ""}
                onChange={(e) =>
                  setIngredientsBySlug((prev) => ({ ...prev, [p.slug]: e.target.value }))
                }
                placeholder="Optional: paste updated ingredient list (product reformulated). Leave empty to re-slay with the stored ingredients."
                rows={3}
                className="mt-3 w-full rounded border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                onClick={() => handleReslay(p)}
                disabled={reslayingSlug !== null}
                className="mt-2 rounded bg-red-700 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {reslayingSlug === p.slug ? "Re-slaying… (takes ~15s)" : "Re-Slay"}
              </button>
            </li>
          ))}
        </ul>
      </section>

      {/* Re-slay result */}
      {reslayError && <p className="text-sm text-red-600">{reslayError}</p>}
      {reslayResult && (
        <section className="rounded border border-green-600 bg-green-50 p-4">
          <h2 className="font-semibold">
            Re-slayed: {reslayResult.name}
            {reslayResult.ingredientsUpdated && (
              <span className="ml-2 text-sm font-normal text-green-800">
                (with updated ingredients)
              </span>
            )}
          </h2>
          <table className="mt-3 w-full text-sm">
            <thead>
              <tr className="text-left text-neutral-500">
                <th className="w-24 py-1 pr-4 font-normal"></th>
                <th className="py-1 pr-4 font-normal">Before</th>
                <th className="py-1 font-normal">After</th>
              </tr>
            </thead>
            <tbody className="align-top">
              <tr>
                <td className="py-1 pr-4 text-neutral-500">Score</td>
                <td className="py-1 pr-4 font-semibold">{reslayResult.before.score ?? "—"}</td>
                <td className="py-1 font-semibold">{reslayResult.after.score ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-neutral-500">Verdict</td>
                <td className="py-1 pr-4">{reslayResult.before.verdictLabel ?? "—"}</td>
                <td className="py-1">{reslayResult.after.verdictLabel ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-neutral-500">Headline</td>
                <td className="py-1 pr-4">{reslayResult.before.headline ?? "—"}</td>
                <td className="py-1">{reslayResult.after.headline ?? "—"}</td>
              </tr>
              <tr>
                <td className="py-1 pr-4 text-neutral-500">Reviewed</td>
                <td className="py-1 pr-4">{formatDate(reslayResult.before.reviewedAt)}</td>
                <td className="py-1">{formatDate(reslayResult.after.reviewedAt)}</td>
              </tr>
            </tbody>
          </table>
        </section>
      )}

      {/* Flag queue */}
      <section className="space-y-3">
        <div className="flex items-baseline justify-between">
          <h2 className="text-lg font-semibold">User-flagged products</h2>
          <button onClick={() => loadFlagged()} className="text-sm text-blue-700 underline">
            Refresh
          </button>
        </div>
        {flagged.length === 0 ? (
          <p className="text-sm text-neutral-500">No open label-change reports.</p>
        ) : (
          <ul className="space-y-2">
            {flagged.map((f) => (
              <li
                key={f.id}
                className="flex items-start justify-between gap-3 rounded border border-neutral-300 p-3 text-sm"
              >
                <div>
                  <span className="font-semibold">{f.product_name ?? "Unknown product"}</span>
                  {f.brand && <span className="text-neutral-500"> — {f.brand}</span>}
                  <p className="text-neutral-700">{f.notes ?? "No reason given"}</p>
                  <p className="text-xs text-neutral-400">{formatDate(f.created_at)}</p>
                </div>
                {f.product_name && (
                  <button
                    onClick={() => {
                      setQuery(f.product_name!);
                      handleSearch(undefined, f.product_name!);
                    }}
                    className="shrink-0 text-blue-700 underline"
                  >
                    Find
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
