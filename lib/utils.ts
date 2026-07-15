import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Canonical hierarchical URL for a product's slay page. */
export function productPath(product: {
  category_slug: string | null;
  brand_slug: string | null;
  slug: string;
}): string {
  return `/products/${product.category_slug ?? "uncategorized"}/${product.brand_slug ?? "unbranded"}/${product.slug}`;
}

/** "cooking-oil" → "Cooking Oil" — display name for a URL slug. */
export function displayNameFromSlug(slug: string): string {
  return slug
    .split("-")
    .map((word) => (word ? word[0].toUpperCase() + word.slice(1) : word))
    .join(" ");
}
