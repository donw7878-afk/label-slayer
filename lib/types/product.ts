import type { VerdictTier } from "./verdict";

export type ProductCategory = "food-drink" | "beauty-personal-care" | "household";

export interface IngredientFlag {
  ingredientSlug: string;
  ingredientName: string;
  severity: "info" | "caution" | "warning" | "critical";
  note: string;
}

export interface ProductSwap {
  productSlug: string;
  productName: string;
  score: number;
  verdict: VerdictTier;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  brand: string;
  category: ProductCategory;
  subcategory?: string;
  barcode?: string;
  imageUrl?: string;
  score: number;
  verdict: VerdictTier;
  summary: string;
  marketingClaims?: string[];
  ingredients: string[];
  flags: IngredientFlag[];
  swaps?: ProductSwap[];
  updatedAt: string;
}
