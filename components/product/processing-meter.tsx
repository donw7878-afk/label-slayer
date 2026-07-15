/**
 * Horizontal stepped indicator for the four processing levels. The current
 * level lights up in its severity color; the rest stay hairline-muted.
 */

const LEVELS = [
  { id: "ultra-processed", label: "Ultra-Processed", color: "#E0472E" },
  { id: "heavily-processed", label: "Heavily Processed", color: "#C4622D" },
  { id: "moderately-processed", label: "Moderately Processed", color: "#D08A3E" },
  { id: "minimally-processed", label: "Minimally Processed", color: "#4E8F63" },
] as const;

export function ProcessingMeter({ level }: { level: string | null }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {LEVELS.map((step) => {
        const active = step.id === level;
        return (
          <div
            key={step.id}
            className="border-t-[3px] px-3 pt-3 pb-2"
            style={{
              borderColor: active ? step.color : "rgba(242,238,230,0.12)",
              backgroundColor: active ? `${step.color}14` : "transparent",
            }}
          >
            <span
              className="text-[11px] font-bold uppercase tracking-[0.1em]"
              style={{ color: active ? step.color : "#6E6A61" }}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
