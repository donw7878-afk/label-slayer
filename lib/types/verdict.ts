export type VerdictTier =
  | "slayer-approved"
  | "clean-enough"
  | "mid-shelf"
  | "sketchy"
  | "toxic-trash"
  | "label-crime";

export interface VerdictDefinition {
  tier: VerdictTier;
  label: string;
  scoreMin: number;
  scoreMax: number;
  color: string;
  description: string;
}
