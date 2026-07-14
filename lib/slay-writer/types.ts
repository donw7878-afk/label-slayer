/**
 * Label Slayer Slay Writer — type definitions.
 *
 * The Slay Writer is the AI voice layer. It takes a deterministic ScoreResult
 * from the Score Engine and produces the written verdict — the "slay" — in the
 * brand's voice. The engine decides the number; the writer explains it.
 */

/** One flagged ingredient with its one-liner roast. */
export interface RedFlagRoast {
  /** The ingredient exactly as the Score Engine flagged it. */
  ingredient: string;
  /** One sentence. Funny through observation, not jokes. */
  roast: string;
}

/**
 * The complete written verdict for one product. Every field is display copy —
 * the UI renders these strings directly, so the AI is the last stop before
 * the user's eyes.
 */
export interface SlayContent {
  /** Blunt one-liner verdict. Under 15 words. */
  headline: string;
  /** 2-3 sentence overview with attitude. */
  summary: string;
  /**
   * 2-3 paragraphs explaining the score, referencing specific ingredients
   * and deductions from the Score Engine's audit trail.
   */
  whyThisScore: string;
  /** What the front of the package claims. Factual with attitude. */
  marketingSays: string;
  /** What the ingredient list actually reveals. */
  labelSays: string;
  /** Each flagged ingredient gets a one-liner roast. Empty for clean products. */
  redFlagBreakdown: RedFlagRoast[];
  /** One-liner about the processing level. */
  processingVerdict: string;
  /** Closing statement. Memorable and quotable — screenshot material. */
  finalWord: string;
  /** Transition line into the clean-swap alternatives section. */
  cleanSwapIntro: string;
}
