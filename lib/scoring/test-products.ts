/**
 * Calibration set.
 *
 * These are the products the engine is tuned against. Each carries the range we
 * believe the score *should* land in; the validation script reports anything
 * that falls outside it. An out-of-range result is not automatically a bug in
 * the engine — it is a disagreement between the rules and our intuition, and
 * either side can be the one that's wrong.
 *
 * Every ingredient list below was verified against the manufacturer's current
 * published label in July 2026 (source recorded on each product). Formulations
 * change — Kraft dropped synthetic dyes in 2016 and the FDA revoked BVO in 2024
 * — so re-verify before trusting a score that has gone stale.
 */

import type { ProductFormat } from "./types";

export interface TestProduct {
  id: string;
  name: string;
  brand: string;
  /** Raw label text, as printed. */
  ingredients: string;
  isOrganic: boolean;
  /** How the product was physically made. See Rule 11 in rules.ts. */
  format?: ProductFormat;
  /** Inclusive range we expect the engine to land in. */
  expectedMin: number;
  expectedMax: number;
  /** Why we expect that range. */
  note: string;
  /** Where the ingredient list came from. */
  source: string;
}

export const TEST_PRODUCTS: TestProduct[] = [
  {
    id: "kraft-mac-and-cheese",
    name: "Original Macaroni & Cheese Dinner",
    brand: "Kraft",
    // Verified: no synthetic dyes. Kraft removed them in 2016 and now colors the
    // sauce with oleoresin paprika, oleoresin turmeric, and annatto.
    ingredients:
      "Enriched Macaroni (Wheat Flour, Durum Flour, Niacin, Ferrous Sulfate, Thiamin Mononitrate, Riboflavin, Folic Acid), Cheese Sauce Mix (Whey, Milkfat, Salt, Milk Protein Concentrate, Sodium Triphosphate, Contains Less than 2% of Tapioca Flour, Citric Acid, Lactic Acid, Sodium Phosphate, Calcium Phosphate, with Oleoresin Paprika, Oleoresin Turmeric, and Annatto added for color, Enzymes, Cheese Culture)",
    isOrganic: false,
    // The cheese is a dehydrated powder — a transformation the ingredient list
    // never admits to. That is what Rule 11 is for.
    format: "powdered",
    expectedMin: 35,
    expectedMax: 45,
    note: "Refined pasta, powdered cheese, three phosphates. No dyes — the sauce is colored with paprika, turmeric, and annatto.",
    source: "kraftheinz.com product page, verified July 2026",
  },
  {
    id: "doritos-nacho-cheese",
    name: "Nacho Cheese Tortilla Chips",
    brand: "Doritos",
    ingredients:
      "Corn, Vegetable Oil (Corn, Canola, and/or Sunflower Oil), Maltodextrin, Salt, Cheddar Cheese (Milk, Cheese Cultures, Salt, Enzymes), Whey, Monosodium Glutamate, Buttermilk, Romano Cheese (Part-Skim Cow's Milk, Cheese Cultures, Salt, Enzymes), Whey Protein Concentrate, Onion Powder, Corn Flour, Natural and Artificial Flavor, Dextrose, Tomato Powder, Lactose, Spices, Artificial Color (Yellow 6, Yellow 5, and Red 40), Lactic Acid, Citric Acid, Sugar, Garlic Powder, Skim Milk, Red and Green Bell Pepper Powder, Disodium Inosinate, Disodium Guanylate",
    isOrganic: false,
    // Fried, which carries NO format penalty on purpose: the frying oil is right
    // there in the ingredient list and already costs 12 points. See Rule 11.
    format: "fried",
    expectedMin: 15,
    expectedMax: 25,
    note: "The archetype: seed oil blend, three dyes, MSG plus both of its amplifiers, four sweeteners.",
    source: "doritos.com / CVS ingredient listing, verified July 2026",
  },
  {
    id: "rxbar-chocolate-sea-salt",
    name: "Chocolate Sea Salt Protein Bar",
    brand: "RXBAR",
    ingredients: "Dates, Egg Whites, Cashews, Almonds, Chocolate, Cocoa, Natural Flavors, Sea Salt",
    isOrganic: false,
    // A pressed, formed bar. The ingredients are real food; the format is not
    // something you could make in a kitchen.
    format: "extruded",
    expectedMin: 55,
    expectedMax: 65,
    note: "Genuinely short, genuinely whole-food list. Everything holding it down is the non-organic cap plus the fact that it is a manufactured bar.",
    source: "shop.rxbar.com, verified July 2026",
  },
  {
    id: "annies-organic-mac-and-cheese",
    name: "Organic Macaroni & Classic Cheddar",
    brand: "Annie's",
    ingredients:
      "Organic Pasta (Organic Wheat Flour), Organic Whey, Organic Cultured Cream, Organic Nonfat Milk, Salt, Organic Butter (Organic Pasteurized Cream, Salt), Organic Dried Cheddar Cheese (Organic Cultured Pasteurized Milk, Salt, Non-Animal Enzymes), Organic Corn Starch, Organic Annatto Extract for Color, Citric Acid, Lactic Acid, Sodium Phosphate, Silicon Dioxide",
    isOrganic: true,
    // Same dehydrated-cheese trick as Kraft, organic or not.
    format: "powdered",
    expectedMin: 70,
    expectedMax: 78,
    note: "Organic, so no cap — and a genuinely cleaner deck than Kraft. Still powdered cheese and refined pasta in a box.",
    source: "annies.com product page, verified July 2026",
  },
  {
    id: "organic-olive-oil",
    name: "Organic Cold-Pressed Extra Virgin Olive Oil",
    brand: "Generic",
    ingredients: "Organic Cold-Pressed Extra Virgin Olive Oil",
    isOrganic: true,
    format: "whole",
    expectedMin: 95,
    expectedMax: 100,
    note: "One ingredient, organic, whole food. If this doesn't score at the top, the engine is broken.",
    source: "Generic single-ingredient control case",
  },
  {
    id: "organic-grass-fed-beef",
    name: "Organic Grass-Fed Ground Beef",
    brand: "Generic",
    ingredients: "Organic Grass-Fed Ground Beef",
    isOrganic: true,
    format: "whole",
    expectedMin: 95,
    expectedMax: 100,
    note: "One ingredient, organic, whole food. Control case, same as the olive oil.",
    source: "Generic single-ingredient control case",
  },
  {
    id: "coca-cola",
    name: "Coca-Cola Classic",
    brand: "Coca-Cola",
    ingredients:
      "Carbonated Water, High Fructose Corn Syrup, Caramel Color, Phosphoric Acid, Natural Flavors, Caffeine",
    isOrganic: false,
    format: "formulated-beverage",
    expectedMin: 10,
    expectedMax: 20,
    note: "Sugar is the first thing after water. Triggers the sweetener-vehicle cap (Rule 10) — though the deductions already take it below 25 on their own.",
    source: "coca-cola.com product page, verified July 2026",
  },
  {
    id: "celsius-energy-drink",
    name: "Sparkling Orange Energy Drink",
    brand: "Celsius",
    ingredients:
      "Carbonated Filtered Water, Citric Acid, Taurine, Guarana Seed Extract, Caffeine, Green Tea Extract, Sucralose, Calcium Carbonate, Ascorbic Acid, Glucuronolactone, Ginger Root Extract, Calcium Pantothenate, Niacinamide, Natural Flavor, Pyridoxine Hydrochloride, Riboflavin, Chromium Chelate, Biotin, Beta-Carotene, Cyanocobalamin",
    isOrganic: false,
    format: "formulated-beverage",
    expectedMin: 40,
    expectedMax: 60,
    note: "No range in the original brief — this one is our judgment. Sucralose is the headline; the nine-vitamin stack is label padding that would otherwise dilute the additive-density ratio.",
    source: "celsius.com product page, verified July 2026",
  },
];
