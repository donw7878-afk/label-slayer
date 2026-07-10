import { getVerdictDefinition } from "@/lib/constants";
import type { VerdictTier } from "@/lib/types/verdict";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  verdict: VerdictTier;
  size?: "sm" | "md";
  className?: string;
}

export function ScoreRing({ score, verdict, size = "md", className }: ScoreRingProps) {
  const definition = getVerdictDefinition(verdict);
  const color = definition?.color ?? "#6E6A61";
  const dimensions = size === "sm" ? "h-12 w-12" : "h-[62px] w-[62px]";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-full border-[3px]",
        dimensions,
        className
      )}
      style={{ borderColor: color }}
    >
      <span
        className={cn("font-extrabold leading-none", size === "sm" ? "text-base" : "text-xl")}
        style={{ color }}
      >
        {score}
      </span>
      <span className="text-[9px] tracking-[0.1em] text-brand-muted">/100</span>
    </div>
  );
}
