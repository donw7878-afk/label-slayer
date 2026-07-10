import { cn } from "@/lib/utils";

interface SwapCardProps {
  variant: "bad" | "good";
  label: string;
  name: string;
  summary: string;
}

export function SwapCard({ variant, label, name, summary }: SwapCardProps) {
  const isGood = variant === "good";
  return (
    <div
      className={cn(
        "border bg-charcoal p-8",
        isGood ? "border-verdict-green/45" : "border-ember/35"
      )}
    >
      <div
        className={cn(
          "mb-4 text-[10px] font-bold uppercase tracking-[0.22em]",
          isGood ? "text-verdict-green" : "text-ember"
        )}
      >
        {label}
      </div>
      <h4 className="mb-1.5 text-[17px] font-bold normal-case">{name}</h4>
      <p className="text-[13px] leading-relaxed text-ivory-dim">{summary}</p>
    </div>
  );
}
