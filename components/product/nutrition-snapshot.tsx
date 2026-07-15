/**
 * Yuka-style per-serving nutrition indicators. Renders nothing when the
 * product has no nutrition_data — the slay is the star, this is garnish.
 */

interface NutrientSpec {
  key: string;
  label: string;
  unit: string;
  /** Returns green | amber | red for a value. `higherIsBetter` nutrients invert. */
  grade: (value: number) => "green" | "amber" | "red";
}

const NUTRIENTS: NutrientSpec[] = [
  {
    key: "calories",
    label: "Calories",
    unit: "kcal",
    grade: (v) => (v <= 150 ? "green" : v <= 300 ? "amber" : "red"),
  },
  {
    key: "protein_g",
    label: "Protein",
    unit: "g",
    grade: (v) => (v >= 10 ? "green" : v >= 4 ? "amber" : "red"),
  },
  {
    key: "fiber_g",
    label: "Fiber",
    unit: "g",
    grade: (v) => (v >= 4 ? "green" : v >= 1.5 ? "amber" : "red"),
  },
  {
    key: "sugar_g",
    label: "Sugar",
    unit: "g",
    grade: (v) => (v <= 5 ? "green" : v <= 12 ? "amber" : "red"),
  },
  {
    key: "sodium_mg",
    label: "Sodium",
    unit: "mg",
    grade: (v) => (v <= 140 ? "green" : v <= 400 ? "amber" : "red"),
  },
  {
    key: "saturated_fat_g",
    label: "Saturated Fat",
    unit: "g",
    grade: (v) => (v <= 1.5 ? "green" : v <= 5 ? "amber" : "red"),
  },
];

const DOT_COLORS = { green: "#4E8F63", amber: "#D08A3E", red: "#E0472E" };

export function NutritionSnapshot({
  data,
}: {
  data: Record<string, number> | null;
}) {
  if (!data) return null;
  const rows = NUTRIENTS.filter((spec) => typeof data[spec.key] === "number");
  if (rows.length === 0) return null;

  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {rows.map((spec) => {
        const value = data[spec.key];
        const color = DOT_COLORS[spec.grade(value)];
        return (
          <div key={spec.key} className="border border-hairline bg-charcoal px-4 py-3">
            <div className="flex items-center gap-2">
              <span
                aria-hidden
                className="inline-block h-2 w-2 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="text-[11px] font-semibold uppercase tracking-[0.1em] text-brand-muted">
                {spec.label}
              </span>
            </div>
            <p className="mt-1 text-[15px] font-bold text-ivory">
              {value}
              <span className="ml-1 text-[11px] font-normal text-ivory-dim">
                {spec.unit}
              </span>
            </p>
          </div>
        );
      })}
    </div>
  );
}
