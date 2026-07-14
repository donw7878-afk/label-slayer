/**
 * Calibration harness.
 *
 * Runs every product in test-products.ts through the engine, prints the full
 * deduction trail, and flags any score that lands outside its expected range.
 *
 *   npx tsx lib/scoring/validate.ts
 *
 * Exits non-zero if any product is out of range, so it can be wired into CI once
 * the ranges are settled.
 */

import { scoreProduct } from "./engine";
import { getVerdictTagline } from "./engine";
import { TEST_PRODUCTS } from "./test-products";

const BOLD = "\x1b[1m";
const DIM = "\x1b[2m";
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

function bar(score: number): string {
  const filled = Math.round(score / 5);
  return `${"█".repeat(filled)}${"·".repeat(20 - filled)}`;
}

let outOfRange = 0;
let slowest = 0;
const summary: Array<{ name: string; score: number; expected: string; ok: boolean }> = [];

console.log(`\n${BOLD}LABEL SLAYER — SCORE ENGINE CALIBRATION${RESET}`);
console.log(`${DIM}${TEST_PRODUCTS.length} products${RESET}\n`);

// Warm up before timing. The first call pays for regex JIT compilation across
// the whole alias index, which is a one-time cost at process start, not the
// per-product cost the 50ms budget is about.
for (const product of TEST_PRODUCTS) scoreProduct(product.ingredients, product.isOrganic, product.format);

for (const product of TEST_PRODUCTS) {
  // Median of 50 runs — a single sample is mostly scheduler noise at this scale.
  const samples: number[] = [];
  for (let i = 0; i < 50; i++) {
    const t = performance.now();
    scoreProduct(product.ingredients, product.isOrganic, product.format);
    samples.push(performance.now() - t);
  }
  samples.sort((a, b) => a - b);
  const elapsed = samples[Math.floor(samples.length / 2)];
  const result = scoreProduct(product.ingredients, product.isOrganic, product.format);
  slowest = Math.max(slowest, elapsed);

  const inRange = result.finalScore >= product.expectedMin && result.finalScore <= product.expectedMax;
  if (!inRange) outOfRange++;
  summary.push({
    name: `${product.brand} ${product.name}`.slice(0, 42),
    score: result.finalScore,
    expected: `${product.expectedMin}–${product.expectedMax}`,
    ok: inRange,
  });

  const status = inRange ? `${GREEN}✓ IN RANGE${RESET}` : `${RED}✗ OUT OF RANGE${RESET}`;
  const delta = inRange
    ? ""
    : result.finalScore > product.expectedMax
      ? ` ${RED}(+${result.finalScore - product.expectedMax} too high)${RESET}`
      : ` ${RED}(-${product.expectedMin - result.finalScore} too low)${RESET}`;

  console.log(`${"─".repeat(78)}`);
  console.log(`${BOLD}${product.brand} — ${product.name}${RESET}`);
  console.log(
    `  ${bar(result.finalScore)} ${BOLD}${result.finalScore}${RESET}/100   ` +
      `${result.verdictLabel} ${DIM}— ${getVerdictTagline(result.verdict)}${RESET}`,
  );
  console.log(`  expected ${product.expectedMin}–${product.expectedMax}   ${status}${delta}`);
  console.log(
    `  ${DIM}${result.totalIngredientCount} ingredients · ${result.redFlagCount} red · ` +
      `${result.amberFlagCount} amber · ${result.greenCount} green · ` +
      `${result.processingLevel} · ${result.sugarAliasCount} sweetener(s) · ` +
      `${product.isOrganic ? "organic" : "not organic"} · ` +
      `format: ${result.format ?? "none"}${result.isSweetenerVehicle ? " · SWEETENER VEHICLE" : ""}${RESET}`,
  );

  console.log(`\n  ${BOLD}Deduction trail${RESET}  ${DIM}(100 − deductions = ${result.rawScore} raw)${RESET}`);
  for (const d of result.deductions) {
    const sign = d.points < 0 ? `${GREEN}${d.points}${RESET}` : `${YELLOW}-${d.points}${RESET}`;
    console.log(`    ${sign.padEnd(20)} ${d.source} ${DIM}[${d.category}]${RESET}`);
    console.log(`    ${DIM}${" ".repeat(6)}${d.reason}${RESET}`);
  }
  if (result.deductions.length === 0) {
    console.log(`    ${GREEN}none — nothing on this label costs it a point.${RESET}`);
  }

  const unmatched = result.flaggedIngredients.length;
  console.log(`\n  ${DIM}final: ${result.rawScore} raw → ${result.finalScore} after floor/ceiling/organic cap`);
  console.log(`  parsed in ${elapsed.toFixed(2)}ms · ${unmatched} flagged ingredient(s)${RESET}`);
  console.log(`  ${DIM}note: ${product.note}${RESET}\n`);
}

console.log(`${"═".repeat(78)}`);
console.log(`${BOLD}SUMMARY${RESET}\n`);
console.log(`  ${DIM}${"product".padEnd(44)}${"score".padEnd(8)}${"expected".padEnd(11)}${RESET}`);
for (const row of summary) {
  const mark = row.ok ? `${GREEN}✓${RESET}` : `${RED}✗${RESET}`;
  const score = row.ok ? `${String(row.score)}` : `${RED}${String(row.score)}${RESET}`;
  console.log(`  ${row.name.padEnd(44)}${score.padEnd(row.ok ? 8 : 17)}${row.expected.padEnd(11)}${mark}`);
}
console.log("");

if (outOfRange === 0) {
  console.log(`${GREEN}${BOLD}All ${TEST_PRODUCTS.length} products landed in their expected range.${RESET}`);
} else {
  console.log(
    `${RED}${BOLD}${outOfRange} of ${TEST_PRODUCTS.length} products fell outside their expected range.${RESET}`,
  );
  console.log(`${DIM}Tune lib/scoring/rules.ts (or the expectations) and re-run.${RESET}`);
}
console.log(`${DIM}Slowest product: ${slowest.toFixed(2)}ms (budget: 50ms)${RESET}\n`);

process.exit(outOfRange === 0 ? 0 : 1);
