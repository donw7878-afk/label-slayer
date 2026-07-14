/**
 * Slay Writer end-to-end test.
 *
 *   npx tsx lib/slay-writer/test-slay.ts
 *
 * Runs three products from the Score Engine calibration set through
 * scoreProduct() and generateSlay(), and prints the complete slays. Only three
 * products, on purpose — each run costs real API calls. Requires
 * ANTHROPIC_API_KEY (set in the environment or in .env.local).
 */

import fs from "node:fs";
import path from "node:path";
import { scoreProduct, TEST_PRODUCTS } from "../scoring";
import { generateSlay } from "./generate-slay";
import type { SlayContent } from "./types";

// tsx doesn't load .env.local the way `next dev` does — pick up the key from
// there if the environment doesn't already have it.
function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const [, key, rawValue] = match;
    if (process.env[key] !== undefined) continue;
    process.env[key] = rawValue.replace(/^["']|["']$/g, "");
  }
}

/** One tone per register: full roast, balanced sarcasm, genuine respect. */
const TEST_CASES: Array<{
  productId: string;
  category: string;
  frontOfPackageClaims: string[];
}> = [
  {
    productId: "doritos-nacho-cheese",
    category: "Snack / Chip",
    frontOfPackageClaims: ["Bold Flavor", "Made with Real Cheese"],
  },
  {
    productId: "kraft-mac-and-cheese",
    category: "Boxed Meal / Pasta",
    frontOfPackageClaims: [
      "The Taste You Love",
      "No Artificial Flavors, Preservatives, or Dyes",
    ],
  },
  {
    productId: "organic-olive-oil",
    category: "Pantry / Cooking Oil",
    frontOfPackageClaims: ["Organic", "Cold-Pressed"],
  },
];

const RULE = "=".repeat(72);

function printSlay(title: string, score: number, slay: SlayContent): void {
  console.log(`\n${RULE}`);
  console.log(`${title} — ${score}/100`);
  console.log(RULE);
  console.log(`\nHEADLINE\n  ${slay.headline}`);
  console.log(`\nSUMMARY\n  ${slay.summary}`);
  console.log(`\nWHY THIS SCORE\n${slay.whyThisScore}`);
  console.log(`\nMARKETING SAYS\n  ${slay.marketingSays}`);
  console.log(`\nLABEL SAYS\n  ${slay.labelSays}`);
  console.log("\nRED FLAG BREAKDOWN");
  if (slay.redFlagBreakdown.length === 0) {
    console.log("  (none — clean label)");
  }
  for (const { ingredient, roast } of slay.redFlagBreakdown) {
    console.log(`  - ${ingredient}: ${roast}`);
  }
  console.log(`\nPROCESSING VERDICT\n  ${slay.processingVerdict}`);
  console.log(`\nFINAL WORD\n  ${slay.finalWord}`);
  console.log(`\nCLEAN SWAP INTRO\n  ${slay.cleanSwapIntro}`);
}

async function main(): Promise<void> {
  loadEnvLocal();

  for (const testCase of TEST_CASES) {
    const product = TEST_PRODUCTS.find((p) => p.id === testCase.productId);
    if (!product) {
      throw new Error(`Unknown test product id: ${testCase.productId}`);
    }

    const scoreResult = scoreProduct(
      product.ingredients,
      product.isOrganic,
      product.format,
    );

    console.log(
      `\nGenerating slay for ${product.brand} ${product.name} (score ${scoreResult.finalScore}, ${scoreResult.verdictLabel})...`,
    );

    const slay = await generateSlay(
      product.name,
      product.brand,
      testCase.category,
      scoreResult,
      testCase.frontOfPackageClaims,
    );

    printSlay(
      `${product.brand} — ${product.name}`,
      scoreResult.finalScore,
      slay,
    );
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
