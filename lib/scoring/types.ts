/**
 * Label Slayer Score Engine — type definitions.
 *
 * The engine is rules-based and deterministic: the same ingredient string and
 * organic flag always produce byte-identical output. No randomness, no clocks,
 * no network, no AI.
 */

// VerdictTier already exists as the app-wide vocabulary (used by the verdict
// badge, the scale section, etc). The engine reuses it rather than declaring a
// competing copy, so there is exactly one definition of the six tiers.
export type { VerdictTier } from "../types/verdict";

/** Traffic-light severity for a single ingredient. */
export type FlagLevel = "red" | "amber" | "green";

/**
 * What kind of thing an ingredient is. Drives which rules apply to it —
 * `sugar-alias` feeds the hidden-sugar rule, the non-green categories feed the
 * processing-level rule.
 */
export type IngredientCategory =
  | "synthetic-dye"
  | "artificial-sweetener"
  | "preservative"
  | "seed-oil"
  | "industrial-emulsifier"
  | "phosphate"
  | "artificial-flavor"
  | "natural-flavor"
  | "sugar-alias"
  | "filler"
  | "thickener"
  | "bleaching-agent"
  | "carcinogenic-concern"
  | "endocrine-disruptor"
  | "whole-food"
  | "minimally-processed"
  | "organic-approved";

/** One row of the master ingredient database. */
export interface IngredientEntry {
  /** Lowercase, normalized. The key we score against. */
  canonicalName: string;
  /** Every label variation we know of. Matched case-insensitively. */
  alternateNames: string[];
  category: IngredientCategory;
  flagLevel: FlagLevel;
  /** Points subtracted from 100 when this ingredient appears. */
  deductionPoints: number;
  /** One line the UI can show to explain the flag. */
  reason: string;
  /** Context only — never affects the score. */
  bannedInCountries?: string[];
}

/** One ingredient pulled off a label and matched against the database. */
export interface ParsedIngredient {
  /** Exactly as it appeared on the label, trimmed but not normalized. */
  rawName: string;
  /** The database entry it matched, or the normalized raw name if unmatched. */
  canonicalName: string;
  /** 1 = first ingredient = largest share by weight. */
  position: number;
  /** False when the ingredient is not in our database. */
  matched: boolean;
  flagLevel: FlagLevel;
  deductionPoints: number;
  reason: string;
  category: string;
  /**
   * True when this came from a parenthetical sub-list, e.g. the "Yellow 5" in
   * "Cheese Sauce Mix (Whey, Yellow 5)". Sub-ingredients still score; they just
   * can't trigger the first-ingredient penalty.
   */
  isSubIngredient: boolean;
  /**
   * False when an earlier position already claimed this canonical name. Repeats
   * are shown but not double-charged — see engine.ts.
   */
  countedInScore: boolean;
}

/** Which rule produced a deduction. Lets the UI group the trail. */
export type DeductionCategory =
  | "ingredient-safety"
  | "ingredient-quality"
  | "processing-level"
  | "organic-cap"
  | "formulation-honesty";

/**
 * One line of the audit trail. `points` is what was subtracted, so a negative
 * value is a credit back to the product (a simplicity bonus, or the safety cap
 * refunding deductions past the ceiling).
 */
export interface ScoreDeduction {
  /** Ingredient name, or the name of the rule that fired. */
  source: string;
  points: number;
  reason: string;
  category: DeductionCategory;
}

export type ProcessingLevel =
  | "ultra-processed"
  | "heavily-processed"
  | "moderately-processed"
  | "minimally-processed";

/**
 * How the product was physically made — the information an ingredient list
 * structurally cannot carry. "Organic dried cheddar cheese" and a block of
 * cheddar declare the same ingredients; only one of them was spray-dried.
 *
 * Optional everywhere. Omit it and Rule 11 simply does not fire.
 */
export type ProductFormat =
  | "whole"
  | "minimally-processed"
  | "fried"
  | "dried"
  | "refined"
  | "reconstituted"
  | "extruded"
  | "formulated-beverage"
  | "powdered";

export interface ScoreResult {
  /** 100 minus every deduction, before the 0–100 clamp and the organic cap. */
  rawScore: number;
  /** What the user sees. Always 0–100. */
  finalScore: number;
  verdict: import("../types/verdict").VerdictTier;
  /** Display name for the tier, e.g. "Slayer Approved". */
  verdictLabel: string;
  /** Every deduction in the order the rules fired. */
  deductions: ScoreDeduction[];
  /** Red and amber ingredients, first occurrence only. */
  flaggedIngredients: ParsedIngredient[];
  totalIngredientCount: number;
  redFlagCount: number;
  amberFlagCount: number;
  greenCount: number;
  processingLevel: ProcessingLevel;
  isOrganic: boolean;
  /** Distinct sweetener types found. 4 means sugar is wearing 4 costumes. */
  sugarAliasCount: number;
  /** The format the caller supplied, if any. Undefined means Rule 11 didn't fire. */
  format?: ProductFormat;
  /** True when Rule 10 fired: a sweetener leads the non-water ingredients. */
  isSweetenerVehicle: boolean;
}
