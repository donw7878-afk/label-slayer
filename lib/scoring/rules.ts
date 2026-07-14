/**
 * Scoring rules and constants.
 *
 * Every number the engine uses lives here. The engine itself contains no magic
 * values, so calibrating Label Slayer means editing this file and re-running
 * the validation script — never rewriting logic.
 */

import type { ProcessingLevel, ProductFormat, VerdictTier } from "./types";

/** Every product starts perfect and earns its way down. */
export const STARTING_SCORE = 100;

/** Rule 7 — the floor. No product goes below zero, however bad. */
export const SCORE_FLOOR = 0;

/** Nothing exceeds 100, even after the simplicity bonus. */
export const SCORE_CEILING = 100;

/**
 * Rule 1 — ingredient deduction cap.
 *
 * Individual ingredient deductions are summed, then capped at 45. Without this,
 * a snack with six dyes would bottom out on dyes alone and the processing,
 * sugar, and complexity rules would have nothing left to say. The cap keeps
 * every rule meaningful and keeps the bottom of the scale from compressing.
 */
export const INGREDIENT_DEDUCTION_CAP = 45;

/**
 * Rule 2 — hidden sugar penalty.
 *
 * The first sweetener costs its normal deduction (already charged by Rule 1).
 * Every *additional* distinct sweetener costs 3 more on top. This exists to
 * catch the oldest trick on the label: split sugar across corn syrup, dextrose,
 * maltodextrin, and cane sugar so that none of them is heavy enough to appear
 * near the top of the ingredient list.
 */
export const SUGAR_ALIAS_PENALTY_PER_EXTRA = 3;

/**
 * Rule 3 — processing level.
 *
 * Counts distinct industrial ingredients (anything flagged red or amber). The
 * count, not the severity, is the signal here: a long list of additives means
 * the product was formulated in a lab, whatever the individual additives are.
 * Bands are inclusive of `maxCount`; the last band is open-ended.
 */
export const PROCESSING_BANDS: Array<{
  maxCount: number;
  level: ProcessingLevel;
  deduction: number;
  label: string;
}> = [
  { maxCount: 2, level: "minimally-processed", deduction: 0, label: "Minimally Processed" },
  { maxCount: 5, level: "moderately-processed", deduction: 4, label: "Moderately Processed" },
  { maxCount: 10, level: "heavily-processed", deduction: 8, label: "Heavily Processed" },
  { maxCount: Infinity, level: "ultra-processed", deduction: 15, label: "Ultra-Processed" },
];

/**
 * Rule 4 — ingredient count complexity.
 *
 * A short list is itself evidence of real food, so 1–5 ingredients earns a
 * bonus (a negative deduction). Long lists are evidence of formulation. Bands
 * are inclusive of `maxCount`.
 */
export const COMPLEXITY_BANDS: Array<{ maxCount: number; deduction: number; label: string }> = [
  { maxCount: 5, deduction: -3, label: "1–5 ingredients" },
  { maxCount: 10, deduction: 0, label: "6–10 ingredients" },
  { maxCount: 20, deduction: 3, label: "11–20 ingredients" },
  { maxCount: 30, deduction: 6, label: "21–30 ingredients" },
  { maxCount: Infinity, deduction: 10, label: "31+ ingredients" },
];

/**
 * Rule 5 — organic cap.
 *
 * A hard ceiling, not a deduction. A product that isn't certified organic
 * cannot exceed 75 no matter how clean its ingredient list reads, because the
 * label says nothing about the pesticides, herbicides, and growing practices
 * behind the ingredients it does list. Conventional produce is invisible to an
 * ingredient parser; this is how the engine accounts for what it cannot see.
 */
export const NON_ORGANIC_SCORE_CAP = 75;

/**
 * Rule 6 — first ingredient penalty.
 *
 * Ingredients are listed by weight. A red flag in position 1 is the bulk of
 * what's in the package, and that is categorically worse than the same flag in
 * position 15, where it may be a trace. Sub-ingredients inside parentheses do
 * not trigger this — only the true first item on the label.
 */
export const FIRST_INGREDIENT_RED_PENALTY = 5;

/**
 * Rule 8 — dose weighting.
 *
 * Ingredient lists are ordered by weight, which is the only quantity signal a
 * label reliably gives us. Use it: a red flag in the first two slots is most of
 * what's in the package, and should cost more than the same flag in slot twenty.
 *
 * Without this, the engine can only punish a product for how MANY bad things it
 * lists, not how MUCH of them it is — and a soda that is essentially sweetener
 * and water scores better than a chip with a long seasoning list. That is
 * backwards, and it is exactly the loophole a formulator would drive through.
 *
 * Applies to top-level ingredients only. Sub-ingredients inside parentheses are
 * ordered by weight *within their parent*, so their flattened position says
 * nothing about their share of the product — weighting them would be inventing
 * precision the label never gave us. They stay at ×1.
 *
 * Bands are inclusive of `maxPosition`.
 */
export const POSITION_WEIGHT_BANDS: Array<{ maxPosition: number; multiplier: number; label: string }> = [
  { maxPosition: 2, multiplier: 2, label: "primary ingredient" },
  { maxPosition: 5, multiplier: 1.5, label: "major ingredient" },
  { maxPosition: Infinity, multiplier: 1, label: "minor ingredient" },
];

/**
 * Rule 9 — additive density.
 *
 * What FRACTION of this product is industrial, rather than how many additives it
 * happens to name. Density is the rule that catches the short-list-of-poison
 * case: Coca-Cola lists six things and five of them are problems, so it is 100%
 * additive by this measure, while Annie's is 15%. Counting alone would let the
 * soda look simple and honest.
 *
 * The lower bands are deliberately gentle, because Rules 3 and 4 are already
 * charging a processed product for its additive count and its list length —
 * density is a third voice on the same subject and must not treble-charge. The
 * top band is where density earns its keep: it is the only rule in the engine
 * that can reach a product whose ingredient list is short *because* almost
 * nothing in it is food.
 *
 * Bands are inclusive of `maxDensity`.
 */
export const DENSITY_BANDS: Array<{ maxDensity: number; deduction: number; label: string }> = [
  { maxDensity: 0.3, deduction: 0, label: "under 30% additives" },
  { maxDensity: 0.5, deduction: 5, label: "30–50% additives" },
  { maxDensity: 0.75, deduction: 12, label: "50–75% additives" },
  { maxDensity: Infinity, deduction: 30, label: "over 75% additives" },
];

/**
 * Excluded from the density denominator.
 *
 * Water is the solvent, not an ingredient — counting it would let any beverage
 * dilute its own additive density toward zero. Added vitamins are the other
 * direction of the same trick: an energy drink that lists eight B-vitamins is
 * padding its label with things that are neither food nor harm, and every one of
 * them would otherwise make the drink look proportionally cleaner. Neither is
 * penalized; they simply don't get a vote on how industrial the product is.
 */
export const DENSITY_EXCLUDED_CANONICALS: readonly string[] = ["water", "vitamins"];

/**
 * Rule 10 — sweetener-vehicle cap.
 *
 * If a sweetener is one of the first two non-water ingredients, the product is a
 * sugar-delivery device with flavoring attached, and it is capped at 25 no
 * matter what else the label says. A hard ceiling, like the organic cap.
 *
 * Note on the definition: the trigger is *position*, not headcount. Counting
 * sweeteners as a share of the ingredient list would not catch Coca-Cola at all
 * — it has exactly one sweetener among five non-water ingredients, a 20% share.
 * What makes Coke sugar water is not how many sweeteners it lists, it is that
 * sugar is the very first thing after water. Position is the signal; the label's
 * own weight ordering is what gives it away.
 *
 * Water is skipped when counting position because every beverage on earth leads
 * with water, and it would push the real first ingredient out of range.
 */
export const SWEETENER_VEHICLE_CAP = 25;

/** How deep into the non-water ingredients a sweetener must be to trigger Rule 10. */
export const SWEETENER_VEHICLE_POSITIONS = 2;

/**
 * Rule 11 — product format.
 *
 * An ingredient list tells you what went in. It does not tell you what was DONE
 * to it, and industrial processing is mostly done TO food, not added to it.
 * Annie's reads as organic pasta, real cheddar, milk, and cream — and scores
 * accordingly — because nothing on the label says the cheese was spray-dried
 * into a powder. That transformation is invisible to a parser, so the caller
 * supplies it.
 *
 * Optional. When `format` is undefined, this rule does not fire and the engine
 * behaves exactly as it did before the rule existed.
 *
 * `fried` is deliberately worth ZERO. Frying is the one industrial process an
 * ingredient list does disclose — the oil is right there, and the seed-oil rule
 * has already charged for it. Charging again here would punish the same fat
 * twice, which is the exact mistake the parser's blend-suppression rule exists
 * to prevent.
 */
export type ProductFormatPenalty = { format: ProductFormat; deduction: number; reason: string };

export const FORMAT_PENALTIES: Record<ProductFormat, { deduction: number; reason: string }> = {
  whole: { deduction: 0, reason: "Whole food. Nothing was done to it that you couldn't do at home." },
  "minimally-processed": {
    deduction: 0,
    reason: "Cut, frozen, or fermented. Traditional handling, not industrial transformation.",
  },
  fried: {
    deduction: 0,
    reason: "Fried — already paid for in the oil, which the ingredient list discloses. Not charged twice.",
  },
  dried: { deduction: 3, reason: "Dehydrated. The mildest of the industrial transformations." },
  refined: { deduction: 5, reason: "Stripped and refined — the fiber, germ, and nutrients were removed by machine." },
  reconstituted: {
    deduction: 8,
    reason: "Broken down and rebuilt from concentrate. What arrives is not what was harvested.",
  },
  extruded: {
    deduction: 12,
    reason: "Forced through a die under heat and pressure into a shape food does not naturally take.",
  },
  "formulated-beverage": {
    deduction: 12,
    reason: "Engineered in a lab as a liquid delivery system. This was formulated, not made.",
  },
  powdered: {
    deduction: 15,
    reason: "Spray-dried into a powder — the single biggest industrial transformation a label never mentions.",
  },
};

/** Verdict bands. Ranges are inclusive on both ends and must tile 0–100. */
export const VERDICT_BANDS: Array<{
  tier: VerdictTier;
  label: string;
  tagline: string;
  min: number;
  max: number;
}> = [
  { tier: "slayer-approved", label: "Slayer Approved", tagline: "Nothing to hide.", min: 90, max: 100 },
  { tier: "clean-enough", label: "Clean Enough", tagline: "Better than most.", min: 75, max: 89 },
  { tier: "mid-shelf", label: "Mid Shelf", tagline: "Read carefully.", min: 50, max: 74 },
  { tier: "sketchy", label: "Sketchy", tagline: "Proceed with caution.", min: 30, max: 49 },
  { tier: "toxic-trash", label: "Toxic Trash", tagline: "This is not food — or care.", min: 10, max: 29 },
  {
    tier: "label-crime",
    label: "Label Crime",
    tagline: "Marketing and reality live in different zip codes.",
    min: 0,
    max: 9,
  },
];

/** Ingredient categories whose members count as an added sweetener for Rule 2. */
export const SUGAR_CATEGORIES = ["sugar-alias", "artificial-sweetener"] as const;
