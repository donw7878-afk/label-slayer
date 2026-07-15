"use client";

/**
 * Bottom-of-page utility bar: share the slay, or report a label change
 * (hits the public flag API, which queues an admin re-slay).
 */

import { useState } from "react";

export function ShareReport({
  slug,
  productName,
  headline,
}: {
  slug: string;
  productName: string;
  headline: string | null;
}) {
  const [copied, setCopied] = useState(false);
  const [reporting, setReporting] = useState(false);
  const [reported, setReported] = useState(false);
  const [reportError, setReportError] = useState("");

  const pageUrl = () => window.location.href;
  const shareText = `${productName} — ${headline ?? "slayed by The Label Slayer"}`;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(pageUrl());
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard unavailable — nothing to do.
    }
  }

  function openShare(url: string) {
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=500");
  }

  async function handleReport() {
    const reason = window.prompt(
      "What changed on the label? (e.g. new ingredient list, reformulation)",
    );
    if (!reason?.trim()) return;
    setReporting(true);
    setReportError("");
    try {
      const res = await fetch("/api/products/flag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, reason: reason.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Report failed");
      setReported(true);
    } catch (err) {
      setReportError(err instanceof Error ? err.message : "Report failed");
    } finally {
      setReporting(false);
    }
  }

  const buttonClass =
    "border border-hairline px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ivory-dim transition-colors hover:border-brass hover:text-brass-bright disabled:opacity-50";

  return (
    <div className="flex flex-wrap items-center gap-2.5">
      <button onClick={handleCopy} className={buttonClass}>
        {copied ? "Link copied" : "Copy link"}
      </button>
      <button
        onClick={() =>
          openShare(
            `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(pageUrl())}`,
          )
        }
        className={buttonClass}
      >
        Share on X
      </button>
      <button
        onClick={() =>
          openShare(
            `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl())}`,
          )
        }
        className={buttonClass}
      >
        Facebook
      </button>
      <span className="mx-1 hidden h-4 w-px bg-hairline sm:block" />
      {reported ? (
        <span className="text-[12px] text-verdict-green">
          Reported — this label is queued for re-review.
        </span>
      ) : (
        <button onClick={handleReport} disabled={reporting} className={buttonClass}>
          {reporting ? "Reporting…" : "Report a label change"}
        </button>
      )}
      {reportError && <span className="text-[12px] text-ember">{reportError}</span>}
    </div>
  );
}
