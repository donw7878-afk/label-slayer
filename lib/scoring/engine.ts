/**
 * The Label Slayer score engine.
 *
 * Deterministic by construction: it reads only its arguments and the frozen
 * tables in rules.ts / ingredient-db.ts. No dates, no randomness, no I/O. The
 * same ingredient string and organic flag will produce an identical ScoreResult
 * on every machine, forever — which is what makes a score defensible when a
 * brand argues with it.
 *
 * Rules fire in a fixed order and each one appends to `deductions`, so the trail
 * the UI shows is the actual arithmetic, not a reconstruction of it.
 */

import { parseIngredients } from "./parser";
import {
  COMPLEXITY_BANDS,
  DENSITY_BANDS,
  DENSITY_EXCLUDED_CANONICALS,
  FIRST_INGREDIENT_RED_PENALTY,
  FORMAT_PENALTIES,
  INGREDIENT_DEDUCTION_CAP,
  NON_ORGANIC_SCORE_CAP,
  POSITION_WEIGHT_BANDS,
  PROCESSING_BANDS,
  SCORE_CEILING,
  SCORE_FLOOR,
  STARTING_SCORE,
  SUGAR_ALIAS_PENALTY_PER_EXTRA,
  SUGAR_CATEGORIES,
  SWEETENER_VEHICLE_CAP,
  SWEETENER_VEHICLE_POSITIONS,
  VERDICT_BANDS,
} from "./rules";
import type {
  DeductionCategory,
  ParsedIngredient,
  ProcessingLevel,
  ProductFormat,
  ScoreDeduction,
  ScoreResult,
  VerdictTier,
} from "./types";

/** Map a 0–100 score to its verdict tier. Scores outside the range are clamped. */
export function getVerdictTier(score: number): VerdictTier {
  const clamped = Math.min(SCORE_CEILING, Math.max(SCORE_FLOOR, score));
  const band = VERDICT_BANDS.find((b) => clamped >= b.min && clamped <= b.max);
  // The bands tile 0–100, so the fallback is unreachable — it exists so the
  // function is total rather than throwing on a future band-editing mistake.
  return band?.tier ?? "label-crime";
}

/** Display name for a tier, e.g. "Slayer Approved". */
export function getVerdictLabel(tier: VerdictTier): string {
  return VERDICT_BANDS.find((b) => b.tier === tier)?.label ?? "Label Crime";
}

/** The one-liner that sits under the verdict, e.g. "Nothing to hide." */
export function getVerdictTagline(tier: VerdictTier): string {
  return VERDICT_BANDS.find((b) => b.tier === tier)?.tagline ?? "";
}

/**
 * A red flag is a safety problem; an amber flag is a quality problem. The split
 * only affects how the UI groups the trail, never the arithmetic.
 */
function deductionCategoryFor(ingredient: ParsedIngredient): DeductionCategory {
  return ingredient.flagLevel === "red" ? "ingredient-safety" : "ingredient-quality";
}

function isSugar(ingredient: ParsedIngredient): boolean {
  return (SUGAR_CATEGORIES as readonly string[]).includes(ingredient.category);
}

/**
 * Rule 8 — how much this ingredient's position says about its dose.
 *
 * Sub-ingredients always weigh ×1: their flattened position reflects where they
 * sit inside their parent, not inside the product.
 */
function positionWeightFor(ingredient: ParsedIngredient): { multiplier: number; label: string } {
  if (ingredient.isSubIngredient) return { multiplier: 1, label: "sub-ingredient" };
  const band =
    POSITION_WEIGHT_BANDS.find((b) => ingredient.position <= b.maxPosition) ??
    POSITION_WEIGHT_BANDS[POSITION_WEIGHT_BANDS.length - 1];
  return { multiplier: band.multiplier, label: band.label };
}

/**
 * Score a product from its ingredient list.
 *
 * @param ingredients Raw ingredient string, exactly as printed on the label.
 * @param isOrganic   Whether the product carries a real organic certification.
 * @param format      Optional. How the product was physically made (Rule 11).
 *                    Omit it and the engine scores exactly as it did before the
 *                    rule existed — every existing caller keeps working.
 */
export function scoreProduct(ingredients: string, isOrganic: boolean, format?: ProductFormat): ScoreResult {
  const parsed = parseIngredients(ingredients);

  // An unparseable label is a data problem, not a clean product. Left alone, an
  // empty list would sail through every rule untouched and come out at 75 —
  // "Clean Enough" — because there is nothing on it to deduct for. Handing a
  // passing grade to a product we know nothing about is the single worst thing
  // this engine could do, so it fails loudly instead.
  if (parsed.length === 0) {
    throw new Error(
      "scoreProduct: no ingredients could be parsed from the input. An empty label cannot be scored — check the source data before calling.",
    );
  }

  const deductions: ScoreDeduction[] = [];

  // ── Deduplication ─────────────────────────────────────────────────────────
  // A label can name the same ingredient twice (salt in the pasta and salt in
  // the sauce packet; canola oil in two sub-lists). Charging twice would punish
  // a product for how its label is laid out rather than what is in it, so only
  // the first occurrence of each canonical ingredient is counted. Later
  // occurrences stay in the parsed list — visible, but free.
  const seen = new Set<string>();
  for (const ingredient of parsed) {
    if (!ingredient.countedInScore) continue; // already suppressed by the parser
    if (seen.has(ingredient.canonicalName)) {
      ingredient.countedInScore = false;
      continue;
    }
    seen.add(ingredient.canonicalName);
  }

  const counted = parsed.filter((i) => i.countedInScore);
  const flagged = counted.filter((i) => i.flagLevel !== "green");

  // ── RULE 1 + RULE 8 — Ingredient deductions, weighted by dose ─────────────
  // Charge each distinct flagged ingredient, scaled by how much of the product
  // it likely is (Rule 8), then cap the total. The cap is applied as an explicit
  // credit line so the trail always sums to the score.
  let ingredientTotal = 0;
  for (const ingredient of flagged) {
    const { multiplier, label } = positionWeightFor(ingredient);
    const points = Math.round(ingredient.deductionPoints * multiplier);
    ingredientTotal += points;
    deductions.push({
      source: ingredient.canonicalName,
      points,
      reason:
        multiplier > 1
          ? `${ingredient.reason} Listed #${ingredient.position} by weight — a ${label} (${ingredient.deductionPoints} × ${multiplier}).`
          : ingredient.reason,
      category: deductionCategoryFor(ingredient),
    });
  }

  if (ingredientTotal > INGREDIENT_DEDUCTION_CAP) {
    const refund = ingredientTotal - INGREDIENT_DEDUCTION_CAP;
    deductions.push({
      source: "Ingredient deduction cap",
      points: -refund,
      reason: `Ingredient deductions totaled ${ingredientTotal}, capped at ${INGREDIENT_DEDUCTION_CAP} so the remaining rules still carry weight.`,
      category: "ingredient-safety",
    });
    ingredientTotal = INGREDIENT_DEDUCTION_CAP;
  }

  // ── RULE 2 — Hidden sugar penalty ─────────────────────────────────────────
  // The first sweetener already cost its normal deduction above. Every extra
  // one costs 3 more, because splitting sugar across several names is a choice
  // made to deceive the ingredient ordering, not a formulation necessity.
  const sugars = counted.filter(isSugar);
  const sugarAliasCount = sugars.length;
  if (sugarAliasCount > 1) {
    const extras = sugarAliasCount - 1;
    const points = extras * SUGAR_ALIAS_PENALTY_PER_EXTRA;
    deductions.push({
      source: "Hidden sugar penalty",
      points,
      reason: `${sugarAliasCount} different sweeteners on one label (${sugars
        .map((s) => s.canonicalName)
        .join(", ")}). Sugar split across ${extras} extra name${extras === 1 ? "" : "s"} sits lower in the ingredient list than it deserves to.`,
      category: "formulation-honesty",
    });
  }

  // ── RULE 3 — Processing level ─────────────────────────────────────────────
  // Driven by how many industrial ingredients are present, not how bad each is.
  // The count is the tell: real food does not need eleven additives.
  const industrialCount = flagged.length;
  const band = PROCESSING_BANDS.find((b) => industrialCount <= b.maxCount) ?? PROCESSING_BANDS[PROCESSING_BANDS.length - 1];
  const processingLevel: ProcessingLevel = band.level;
  if (band.deduction > 0) {
    deductions.push({
      source: `Processing level: ${band.label}`,
      points: band.deduction,
      reason: `${industrialCount} industrial ingredient${industrialCount === 1 ? "" : "s"} on the label.`,
      category: "processing-level",
    });
  }

  // ── RULE 9 — Additive density ─────────────────────────────────────────────
  // The share of the label that is industrial, rather than the count. This is
  // what stops a product from hiding behind a short ingredient list: a soda that
  // lists six things, five of them additives, is not "simple" — it is 100%
  // formulation. Water and added vitamins are excluded from the denominator so
  // they can't dilute the ratio.
  const densityDenominator = counted.filter(
    (i) => !(DENSITY_EXCLUDED_CANONICALS as readonly string[]).includes(i.canonicalName),
  );
  const flaggedInDenominator = densityDenominator.filter((i) => i.flagLevel !== "green");
  const density = densityDenominator.length > 0 ? flaggedInDenominator.length / densityDenominator.length : 0;
  const densityBand =
    DENSITY_BANDS.find((b) => density <= b.maxDensity) ?? DENSITY_BANDS[DENSITY_BANDS.length - 1];
  if (densityBand.deduction > 0) {
    deductions.push({
      source: `Additive density: ${Math.round(density * 100)}%`,
      points: densityBand.deduction,
      reason: `${flaggedInDenominator.length} of ${densityDenominator.length} real ingredients are industrial (${densityBand.label}). A short ingredient list is not the same as a clean one.`,
      category: "processing-level",
    });
  }

  // ── RULE 4 — Ingredient count complexity ──────────────────────────────────
  // Counts every ingredient the label discloses, sub-ingredients included —
  // that is the true length of the formulation. A short list earns a bonus.
  const totalIngredientCount = parsed.length;
  const complexity =
    COMPLEXITY_BANDS.find((b) => totalIngredientCount <= b.maxCount) ?? COMPLEXITY_BANDS[COMPLEXITY_BANDS.length - 1];
  if (complexity.deduction !== 0 && totalIngredientCount > 0) {
    deductions.push({
      source: complexity.deduction < 0 ? "Simplicity bonus" : "Complexity penalty",
      points: complexity.deduction,
      reason:
        complexity.deduction < 0
          ? `${totalIngredientCount} ingredients. Short lists are what real food looks like.`
          : `${totalIngredientCount} ingredients (${complexity.label}). Length is formulation, not cooking.`,
      category: "processing-level",
    });
  }

  // ── RULE 6 — First ingredient penalty ─────────────────────────────────────
  // Ingredients are ordered by weight, so a red flag in slot 1 is the product's
  // main constituent. Sub-ingredients can't trigger this — only the real first
  // item on the label.
  const first = parsed[0];
  if (first && !first.isSubIngredient && first.flagLevel === "red") {
    deductions.push({
      source: `First ingredient: ${first.canonicalName}`,
      points: FIRST_INGREDIENT_RED_PENALTY,
      reason: "The single largest ingredient by weight is red-flagged. This is what the product mostly is.",
      category: "ingredient-safety",
    });
  }

  // ── Tally ─────────────────────────────────────────────────────────────────
  const totalDeductions = deductions.reduce((sum, d) => sum + d.points, 0);
  const rawScore = STARTING_SCORE - totalDeductions;

  // Ceiling first — the simplicity bonus can push a raw score past 100.
  let finalScore = Math.min(SCORE_CEILING, Math.max(SCORE_FLOOR, rawScore));

  // ── RULE 5 — Organic cap ──────────────────────────────────────────────────
  // A hard ceiling. An ingredient list cannot tell you what was sprayed on the
  // field, so a product with no organic certification cannot reach the top of
  // the scale on a clean-looking label alone.
  if (!isOrganic && finalScore > NON_ORGANIC_SCORE_CAP) {
    const lost = finalScore - NON_ORGANIC_SCORE_CAP;
    deductions.push({
      source: "Non-organic cap",
      points: lost,
      reason: `Not certified organic. Scores are capped at ${NON_ORGANIC_SCORE_CAP} — the label says nothing about what was sprayed on the crops behind it.`,
      category: "organic-cap",
    });
    finalScore = NON_ORGANIC_SCORE_CAP;
  }

  // ── RULE 11 — Product format ──────────────────────────────────────────────
  // Deliberately applied AFTER the organic cap, not before.
  //
  // The two rules answer independent questions — "what don't we know about the
  // farming?" and "what was done to this in the factory?" — and a product can
  // deserve both penalties. If format were charged before the cap, the cap would
  // swallow it whole: RXBAR's raw 95 minus 12 for being an extruded bar is 83,
  // which still gets clamped to 75, and the format penalty vanishes without
  // trace. Charging it after the ceiling means the debit actually lands.
  if (format) {
    const penalty = FORMAT_PENALTIES[format];
    if (penalty.deduction > 0) {
      deductions.push({
        source: `Format: ${format}`,
        points: penalty.deduction,
        reason: penalty.reason,
        category: "processing-level",
      });
      finalScore -= penalty.deduction;
    }
  }

  // ── RULE 10 — Sweetener-vehicle cap ───────────────────────────────────────
  // If a sweetener is one of the first two non-water ingredients, this product
  // is sugar with flavoring attached, and nothing else on the label can rescue
  // it above 25.
  const nonWater = parsed.filter((i) => i.canonicalName !== "water");
  const isSweetenerVehicle = nonWater
    .slice(0, SWEETENER_VEHICLE_POSITIONS)
    .some((i) => isSugar(i));

  if (isSweetenerVehicle && finalScore > SWEETENER_VEHICLE_CAP) {
    const lost = finalScore - SWEETENER_VEHICLE_CAP;
    deductions.push({
      source: "Sweetener-vehicle cap",
      points: lost,
      reason: `Sugar is one of the first two ingredients after water. This is a sweetener-delivery product, and it is capped at ${SWEETENER_VEHICLE_CAP}.`,
      category: "formulation-honesty",
    });
    finalScore = SWEETENER_VEHICLE_CAP;
  }

  // RULE 7 — the floor, applied last. No negative scores, ever.
  finalScore = Math.max(SCORE_FLOOR, finalScore);

  const verdict = getVerdictTier(finalScore);

  return {
    rawScore,
    finalScore,
    verdict,
    verdictLabel: getVerdictLabel(verdict),
    deductions,
    flaggedIngredients: flagged,
    totalIngredientCount,
    redFlagCount: counted.filter((i) => i.flagLevel === "red").length,
    amberFlagCount: counted.filter((i) => i.flagLevel === "amber").length,
    greenCount: counted.filter((i) => i.flagLevel === "green" && i.matched).length,
    processingLevel,
    isOrganic,
    sugarAliasCount,
    format,
    isSweetenerVehicle,
  };
}
