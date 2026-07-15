/**
 * Label Slayer Product Data Pipeline.
 *
 *   import { slayByBarcode, slayBySearch, slayProduct } from "@/lib/pipeline";
 *
 * Requires ANTHROPIC_API_KEY plus the Supabase env vars (see
 * .env.local.example).
 */

export { slayProduct, slayByBarcode, slayBySearch, productSlug, slugify } from "./pipeline";
export { lookupProduct, lookupByBarcode, searchByName, looksLikeBarcode } from "./lookup";
export { submitProductForReview } from "./submit";
export type { SubmitProductInput, SubmitProductResult } from "./submit";
export type {
  ProductLookupResult,
  LookupOutcome,
  SlayProductInput,
  SlayResult,
  ProductSource,
} from "./types";
