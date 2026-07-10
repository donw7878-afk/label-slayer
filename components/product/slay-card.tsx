"use client";

import { motion } from "framer-motion";
import type { VerdictTier } from "@/lib/types/verdict";
import { ScoreRing } from "./score-ring";
import { VerdictBadge } from "./verdict-badge";

interface SlayCardProps {
  name: string;
  brand?: string;
  score: number;
  verdict: VerdictTier;
  summary: string;
}

export function SlayCard({ name, brand = "Sample product", score, verdict, summary }: SlayCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4, borderColor: "rgba(242,238,230,0.25)" }}
      className="cursor-pointer border border-hairline bg-charcoal p-7"
    >
      <div className="mb-5 flex items-start justify-between">
        <ScoreRing score={score} verdict={verdict} />
        <VerdictBadge tier={verdict} />
      </div>
      <h4 className="mb-1 text-[17px] font-bold normal-case">{name}</h4>
      <div className="mb-3.5 text-xs uppercase tracking-[0.08em] text-brand-muted">
        {brand}
      </div>
      <p className="border-t border-hairline pt-3.5 text-[13px] leading-relaxed text-ivory-dim [&_em]:font-semibold [&_em]:not-italic [&_em]:text-ember">
        {summary}
      </p>
    </motion.div>
  );
}
