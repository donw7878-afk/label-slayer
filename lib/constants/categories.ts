import type { ProductCategory } from "@/lib/types/product";

export interface CategoryDefinition {
  id: ProductCategory;
  number: string;
  name: string;
  description: string;
  comingSoon?: boolean;
}

export const CATEGORIES: CategoryDefinition[] = [
  {
    id: "food-drink",
    number: "/ 01",
    name: "Food & Drink",
    description:
      "Real food should look like food. We flag industrial additives, engineered fillers, dyes, seed oils, and health-halo marketing that the ingredient list doesn't back up.",
  },
  {
    id: "beauty-personal-care",
    number: "/ 02",
    name: "Beauty & Personal Care",
    description:
      "Botanical branding doesn't mean clean formulation. We run skincare, haircare, and cosmetics through the same truth-first lens — trendy or not.",
  },
  {
    id: "household",
    number: "/ 03",
    name: "Household",
    description:
      "The products you clean, spray, and breathe around your family deserve the same scrutiny. Same blade, new shelf.",
    comingSoon: true,
  },
];

export const SEARCH_CHIPS = [
  "Snacks",
  "Cereal",
  "Beverages",
  "Skincare",
  "Shampoo",
  "Protein",
  "Candy",
  "Frozen",
];

export const TRUST_STRIP_ITEMS = [
  "No brand influence",
  "No pay-to-play scores",
  "No cleanwashing",
  "No fads. No hype.",
  "Just the label",
];

export const BELIEF_PILLARS = [
  {
    title: "Ancestral common sense",
    description: "Real food grew, walked, flew, or swam before it hit your plate.",
  },
  {
    title: "Minimal processing",
    description: "The further from its original form, the more questions we ask.",
  },
  {
    title: "Clean ingredients",
    description: "Short decks, recognizable words, nothing hiding behind a number.",
  },
  {
    title: "No marketing BS",
    description: "Buzzwords aren't evidence. The label is the only witness we trust.",
  },
  {
    title: "Truth over trends",
    description: "No fad diets, no biohacker hype, no fearmongering. Just the facts.",
  },
];
