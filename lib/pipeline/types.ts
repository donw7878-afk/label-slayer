/**
 * Product Data Pipeline — type definitions.
 */

import type { ProductRow } from "../database/queries";
import type { SlayContent } from "../slay-writer";

/** Where a product's data originally came from. */
export type ProductSource =
  | "openfoodfacts"
  | "openbeautyfacts"
  | "usda"
  | "manual"
  | "user-submitted";

/** One product as found by lookup — external API or our own database. */
export interface ProductLookupResult {
  name: string;
  brand: string | null;
  ingredients_raw: string | null;
  barcode: string | null;
  category: string | null;
  subcategory: string | null;
  imageUrl: string | null;
  source: ProductSource;
  sourceId: string | null;
  isOrganic: boolean;
  /** True when the product is already in Supabase (slug set below). */
  existsInDatabase: boolean;
  /** Set when existsInDatabase — the canonical record's slug. */
  slug: string | null;
}

/** Discriminated result of lookupProduct — barcode gives one, search gives many. */
export type LookupOutcome =
  | { kind: "barcode"; result: ProductLookupResult | null }
  | { kind: "search"; results: ProductLookupResult[] };

/** Input to the main pipeline orchestrator. */
export interface SlayProductInput {
  name: string;
  brand?: string;
  category?: string;
  subcategory?: string;
  barcode?: string;
  ingredientsRaw: string;
  isOrganic?: boolean;
  productFormat?: string;
  imageUrl?: string;
  source?: ProductSource;
  sourceId?: string;
  frontClaims?: string[];
}

/** What slayByBarcode / slayBySearch hand back. */
export type SlayResult =
  | {
      status: "slayed";
      product: ProductRow;
      slayContent: SlayContent;
      /** True when served from Supabase without re-scoring. */
      fromCache: boolean;
    }
  | {
      /** We found the product but not its ingredients — user must submit. */
      status: "needs-submission";
      lookup: ProductLookupResult;
      message: string;
    }
  | { status: "not-found"; message: string };
