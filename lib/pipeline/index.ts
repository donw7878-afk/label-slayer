/**
 * Label Slayer Product Data Pipeline.
 *
 *   import { slayByBarcode, slayBySearch, slayProduct } from "@/lib/pipeline";
 *
 * Requires ANTHROPIC_API_KEY plus the Supabase env vars (see
 * .env.local.example).
 */

export {
  slayProduct,
  slayByBarcode,
  slayBySearch,
  productSlug,
  slugify,
  categorySlugFor,
  brandSlugFor,
} from "./pipeline";
export { lookupProduct, lookupByBarcode, searchByName, searchExternal, looksLikeBarcode } from "./lookup";
export { searchUSDA, lookupUSDAByBarcode, getUSDAProduct, mapUsdaFood } from "./usda";
export { cleanProductName } from "./cleanup";
export { submitProductForReview } from "./submit";
export type { SubmitProductInput, SubmitProductResult } from "./submit";
export type {
  ProductLookupResult,
  LookupOutcome,
  SlayProductInput,
  SlayResult,
  ProductSource,
} from "./types";
