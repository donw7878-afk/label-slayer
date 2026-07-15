import { getVerdictDefinition } from "@/lib/constants";
import type { VerdictTier } from "@/lib/types/verdict";
import { cn } from "@/lib/utils";

interface ScoreRingProps {
  score: number;
  verdict: VerdictTier;
  size?: "sm" | "md" | "lg";
  className?: string;
}

const DIMENSIONS: Record<NonNullable<ScoreRingProps["size"]>, string> = {
  sm: "h-12 w-12 border-[3px]",
  md: "h-[62px] w-[62px] border-[3px]",
  lg: "h-[132px] w-[132px] border-[5px]",
};

const NUMBER_SIZES: Record<NonNullable<ScoreRingProps["size"]>, string> = {
  sm: "text-base",
  md: "text-xl",
  lg: "text-[44px]",
};

export function ScoreRing({ score, verdict, size = "md", className }: ScoreRingProps) {
  const definition = getVerdictDefinition(verdict);
  const color = definition?.color ?? "#6E6A61";

  return (
    <div
      className={cn(
        "flex shrink-0 flex-col items-center justify-center rounded-full",
        DIMENSIONS[size],
        className
      )}
      style={{ borderColor: color }}
    >
      <span className={cn("font-extrabold leading-none", NUMBER_SIZES[size])} style={{ color }}>
        {score}
      </span>
      <span
        className={cn(
          "tracking-[0.1em] text-brand-muted",
          size === "lg" ? "mt-1 text-[11px]" : "text-[9px]"
        )}
      >
        /100
      </span>
    </div>
  );
}
