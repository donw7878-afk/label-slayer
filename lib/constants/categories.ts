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

/** The browsable category grid on /products. Slugs match products.category_slug. */
export interface BrowseCategory {
  slug: string;
  name: string;
  description: string;
}

export const BROWSE_CATEGORIES: BrowseCategory[] = [
  { slug: "snacks", name: "Snacks", description: "Chips, crackers, and everything the vending machine sells." },
  { slug: "beverages", name: "Beverages", description: "Sodas, juices, energy drinks, and other liquid labels." },
  { slug: "cereal", name: "Cereal", description: "Breakfast in a box — mascots not included in the score." },
  { slug: "dairy", name: "Dairy", description: "Milk, cheese, yogurt, and their many imitators." },
  { slug: "frozen", name: "Frozen", description: "Dinners, pizzas, and desserts from the cold aisle." },
  { slug: "condiments", name: "Condiments", description: "Sauces, dressings, and spreads doing quiet damage." },
  { slug: "baked-goods", name: "Baked Goods", description: "Breads, buns, and pastries — preserved or otherwise." },
  { slug: "candy", name: "Candy", description: "At least these labels are honest about the sugar." },
  { slug: "protein", name: "Protein", description: "Bars, powders, and shakes with big macro energy." },
  { slug: "supplements", name: "Supplements", description: "Vitamins and boosters — bioavailability varies." },
  { slug: "skincare", name: "Skincare", description: "Serums and creams read like food labels here." },
  { slug: "haircare", name: "Haircare", description: "Shampoo, conditioner, and the fragrance loophole." },
  { slug: "personal-care", name: "Personal Care", description: "Deodorant, toothpaste, and daily-contact labels." },
  { slug: "household", name: "Household", description: "What you clean and spray around your family." },
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
