import type { VerdictDefinition } from "@/lib/types/verdict";

export const VERDICT_TIERS: VerdictDefinition[] = [
  {
    tier: "slayer-approved",
    label: "Slayer Approved",
    scoreMin: 90,
    scoreMax: 100,
    color: "#4E8F63",
    description: "Clean deck, minimal processing, marketing matches the label.",
  },
  {
    tier: "clean-enough",
    label: "Clean Enough",
    scoreMin: 75,
    scoreMax: 89,
    color: "#7FA86A",
    description: "Solid choice with minor compromises worth knowing about.",
  },
  {
    tier: "mid-shelf",
    label: "Mid Shelf",
    scoreMin: 50,
    scoreMax: 74,
    color: "#D08A3E",
    description: "Not a disaster, not a win. Better options exist.",
  },
  {
    tier: "sketchy",
    label: "Sketchy",
    scoreMin: 30,
    scoreMax: 49,
    color: "#C96A2E",
    description: "Multiple red flags. The front label is doing heavy lifting.",
  },
  {
    tier: "toxic-trash",
    label: "Toxic Trash",
    scoreMin: 10,
    scoreMax: 29,
    color: "#E0472E",
    description: "Engineered food-like product. The deck reads like a chemistry set.",
  },
  {
    tier: "label-crime",
    label: "Label Crime",
    scoreMin: 0,
    scoreMax: 9,
    color: "#B03A28",
    description: "The marketing and the label live in different realities. Slayed on sight.",
  },
];

export function getVerdictByScore(score: number): VerdictDefinition {
  const match = VERDICT_TIERS.find((v) => score >= v.scoreMin && score <= v.scoreMax);
  return match ?? VERDICT_TIERS[VERDICT_TIERS.length - 1];
}

export function getVerdictDefinition(tier: string): VerdictDefinition | undefined {
  return VERDICT_TIERS.find((v) => v.tier === tier);
}
