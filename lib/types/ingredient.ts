export type IngredientRiskLevel = "clean" | "caution" | "avoid";

export interface Ingredient {
  id: string;
  slug: string;
  name: string;
  aliases: string[];
  category: string;
  riskLevel: IngredientRiskLevel;
  summary: string;
  foundIn: string[];
  sourcesCount?: number;
  updatedAt: string;
}
