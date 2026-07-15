/**
 * Interactive ingredient breakdown — every ingredient on the label as a row
 * with its flag dot, reason, and deduction. Server component: parses the
 * stored ingredient string through the Score Engine's parser (read-only).
 */

import Link from "next/link";
import { parseIngredients } from "@/lib/scoring";
import { slugify } from "@/lib/pipeline";

const FLAG_COLORS: Record<string, string> = {
  red: "#E0472E",
  amber: "#D08A3E",
  green: "#4E8F63",
};

export function IngredientList({ ingredientsRaw }: { ingredientsRaw: string }) {
  const parsed = parseIngredients(ingredientsRaw);
  const flagged = parsed.filter(
    (ing) => ing.flagLevel === "red" || ing.flagLevel === "amber",
  );

  return (
    <div>
      <p className="mb-5 text-sm text-ivory-dim">
        <span className="font-bold text-ivory">{flagged.length}</span> of{" "}
        <span className="font-bold text-ivory">{parsed.length}</span> ingredients
        flagged
      </p>
      <ul className="divide-y divide-hairline border border-hairline bg-charcoal">
        {parsed.map((ing) => {
          const color = FLAG_COLORS[ing.flagLevel] ?? FLAG_COLORS.green;
          const isFlagged = ing.flagLevel === "red" || ing.flagLevel === "amber";
          const ingredientSlug = ing.matched ? slugify(ing.canonicalName) : null;
          return (
            <li
              key={`${ing.position}-${ing.rawName}`}
              className="flex items-baseline gap-3 px-4 py-3 md:px-5"
            >
              <span className="w-6 shrink-0 text-right text-[11px] tabular-nums text-brand-muted">
                {ing.position}
              </span>
              <span
                aria-hidden
                className="relative top-[-1px] inline-block h-2 w-2 shrink-0 rounded-full"
                style={{ backgroundColor: color }}
              />
              <span className="min-w-0 flex-1">
                {ingredientSlug ? (
                  <Link
                    href={`/ingredients/${ingredientSlug}`}
                    className="text-[14px] font-semibold text-ivory transition-colors hover:text-brass-bright"
                  >
                    {ing.rawName}
                  </Link>
                ) : (
                  <span className="text-[14px] font-semibold text-ivory">
                    {ing.rawName}
                  </span>
                )}
                {isFlagged && ing.reason && (
                  <span className="block text-[12px] leading-relaxed text-ivory-dim">
                    {ing.reason}
                  </span>
                )}
              </span>
              {isFlagged && ing.countedInScore && ing.deductionPoints > 0 && (
                <span
                  className="shrink-0 text-[12px] font-bold tabular-nums"
                  style={{ color }}
                >
                  -{ing.deductionPoints} pts
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
