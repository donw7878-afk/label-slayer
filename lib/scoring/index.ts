/**
 * Label Slayer Score Engine.
 *
 * Rules-based, deterministic, dependency-free. Import from "@/lib/scoring".
 *
 *   import { scoreProduct } from "@/lib/scoring";
 *   const result = scoreProduct(product.ingredients, product.isOrganic);
 */

export { scoreProduct, getVerdictTier, getVerdictLabel, getVerdictTagline } from "./engine";
export { parseIngredients, normalizeIngredientName } from "./parser";
export { INGREDIENT_DB, INGREDIENT_DB_SIZE, findIngredient } from "./ingredient-db";
export {
  STARTING_SCORE,
  INGREDIENT_DEDUCTION_CAP,
  NON_ORGANIC_SCORE_CAP,
  FIRST_INGREDIENT_RED_PENALTY,
  SUGAR_ALIAS_PENALTY_PER_EXTRA,
  SWEETENER_VEHICLE_CAP,
  FORMAT_PENALTIES,
  POSITION_WEIGHT_BANDS,
  DENSITY_BANDS,
  PROCESSING_BANDS,
  COMPLEXITY_BANDS,
  VERDICT_BANDS,
} from "./rules";
export { TEST_PRODUCTS } from "./test-products";
export type { TestProduct } from "./test-products";
export type {
  FlagLevel,
  IngredientCategory,
  IngredientEntry,
  ParsedIngredient,
  DeductionCategory,
  ScoreDeduction,
  ProcessingLevel,
  ProductFormat,
  ScoreResult,
  VerdictTier,
} from "./types";
