import type { Product } from "@/lib/types/product";
import type { BlogPost } from "@/lib/types/blog";

export const SAMPLE_PRODUCTS: Pick<
  Product,
  "slug" | "name" | "score" | "verdict" | "summary"
>[] = [
  {
    slug: "rainbow-fruit-snacks",
    name: "Rainbow Fruit Snacks",
    score: 18,
    verdict: "label-crime",
    summary:
      '"Made with real fruit" on the front. 3 synthetic dyes, corn syrup base, and 2% juice on the back.',
  },
  {
    slug: "oat-crunch-granola",
    name: "Oat Crunch Granola",
    score: 54,
    verdict: "mid-shelf",
    summary:
      "Decent base ingredients, but added sugars appear three times under three different names.",
  },
  {
    slug: "cold-pressed-olive-oil",
    name: "Cold-Pressed Olive Oil",
    score: 91,
    verdict: "slayer-approved",
    summary:
      "One ingredient. Your great-grandparents would recognize it. That's the whole review.",
  },
];

export const SAMPLE_SWAP = {
  bad: {
    label: "Slayed — 22/100",
    name: '"Fruit & Grain" Breakfast Bar',
    summary:
      "11g added sugar, palm oil blend, synthetic dye, and a fruit filling that's mostly glucose syrup with fruit flavoring.",
  },
  good: {
    label: "Slayer Approved — 88/100",
    name: "Date & Almond Bar",
    summary:
      "Four ingredients: dates, almonds, sea salt, cinnamon. Sweetened by actual fruit. Imagine that.",
  },
};

export const SAMPLE_BLOG_POSTS: Pick<
  BlogPost,
  "slug" | "title" | "excerpt" | "category"
>[] = [
  {
    slug: "seven-ways-sugar-hides",
    category: "Label Lies",
    title: "The 7 ways sugar hides on an ingredient list",
    excerpt:
      'Maltodextrin, rice syrup, "fruit juice concentrate" — same molecule, better disguise.',
  },
  {
    slug: "clean-beauty-no-legal-definition",
    category: "Beauty Truths",
    title: '"Clean beauty" has no legal definition. Brands know it.',
    excerpt: "What that leaf on the packaging actually promises you: nothing.",
  },
  {
    slug: "red-40-explained",
    category: "Ingredient Intel",
    title: "Red 40: what it is, where it hides, why we flag it",
    excerpt:
      "The most common synthetic dye in America, explained without the hysteria.",
  },
];
