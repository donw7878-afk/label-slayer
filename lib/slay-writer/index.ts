/**
 * Label Slayer Slay Writer — the AI voice layer.
 *
 *   import { generateSlay } from "@/lib/slay-writer";
 *   const slay = await generateSlay(name, brand, category, scoreResult, claims);
 *
 * Requires ANTHROPIC_API_KEY in the environment.
 */

export { generateSlay } from "./generate-slay";
export { formatSlayInput } from "./format-input";
export { SLAY_WRITER_SYSTEM_PROMPT } from "./system-prompt";
export type { SlayContent, RedFlagRoast } from "./types";
