import { getVerdictDefinition } from "@/lib/constants";
import type { VerdictTier } from "@/lib/types/verdict";
import { cn } from "@/lib/utils";

interface VerdictBadgeProps {
  tier: VerdictTier;
  className?: string;
}

export function VerdictBadge({ tier, className }: VerdictBadgeProps) {
  const verdict = getVerdictDefinition(tier);
  if (!verdict) return null;

  return (
    <span
      className={cn(
        "inline-flex items-center px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-[0.18em]",
        className
      )}
      style={{
        backgroundColor: `${verdict.color}1f`,
        color: verdict.color,
      }}
    >
      {verdict.label}
    </span>
  );
}
