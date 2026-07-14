/**
 * Transforms a ScoreResult into the user-message prompt the Slay Writer sees.
 *
 * The few-shot examples in generate-slay.ts are written in exactly this shape —
 * if the format here changes, update them too or the voice-lock weakens.
 */

import type { ScoreResult, ParsedIngredient, ScoreDeduction } from "../scoring";

const PROCESSING_LABELS: Record<ScoreResult["processingLevel"], string> = {
  "ultra-processed": "Ultra-Processed",
  "heavily-processed": "Heavily Processed",
  "moderately-processed": "Moderately Processed",
  "minimally-processed": "Minimally Processed",
};

function formatDeduction(d: ScoreDeduction): string {
  const points =
    d.points >= 0 ? `-${d.points} points` : `+${Math.abs(d.points)} points`;
  return `- ${d.source}: ${points} — ${d.reason}`;
}

function formatFlag(ing: ParsedIngredient): string {
  return `- ${ing.rawName}: ${ing.reason}`;
}

export function formatSlayInput(
  productName: string,
  brand: string,
  category: string,
  scoreResult: ScoreResult,
  frontOfPackageClaims?: string[],
): string {
  const redFlags = scoreResult.flaggedIngredients.filter(
    (ing) => ing.flagLevel === "red",
  );
  const amberFlags = scoreResult.flaggedIngredients.filter(
    (ing) => ing.flagLevel === "amber",
  );

  const lines: string[] = [
    `Product: ${productName}`,
    `Brand: ${brand}`,
    `Category: ${category}`,
    `Score: ${scoreResult.finalScore} / 100`,
    `Verdict: ${scoreResult.verdictLabel}`,
    `Processing Level: ${PROCESSING_LABELS[scoreResult.processingLevel]}`,
    `Is Organic: ${scoreResult.isOrganic ? "Yes" : "No"}`,
    "",
    "Deduction Trail:",
    ...(scoreResult.deductions.length > 0
      ? scoreResult.deductions.map(formatDeduction)
      : ["- None. Nothing to deduct."]),
    "",
    "Flagged Ingredients (Red):",
    ...(redFlags.length > 0 ? redFlags.map(formatFlag) : ["- None"]),
    "",
    "Flagged Ingredients (Amber):",
    ...(amberFlags.length > 0 ? amberFlags.map(formatFlag) : ["- None"]),
    "",
    "Front-of-Package Claims:",
    ...(frontOfPackageClaims && frontOfPackageClaims.length > 0
      ? frontOfPackageClaims.map((claim) => `- '${claim}'`)
      : ["- None provided"]),
    "",
    `Total Ingredients: ${scoreResult.totalIngredientCount}`,
    `Red Flags: ${scoreResult.redFlagCount}`,
    `Amber Flags: ${scoreResult.amberFlagCount}`,
    `Sugar Aliases Found: ${scoreResult.sugarAliasCount}`,
  ];

  if (scoreResult.isSweetenerVehicle) {
    lines.push(
      "Note: A sweetener leads the non-water ingredients — this product is primarily a sugar-delivery vehicle.",
    );
  }

  lines.push("", "Generate the slay.");

  return lines.join("\n");
}
