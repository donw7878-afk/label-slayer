/**
 * Ingredient label parser.
 *
 * Turns the run-on string printed on a package into a positioned, matched list
 * of ingredients. Regex and string work only — no tokenizer, no AI, no network.
 * The same string always parses to the same array.
 *
 * The hard parts of a real label, and how each is handled:
 *  - Nested sub-ingredients: "Cheese Sauce Mix (Whey, Yellow 5)". The dyes hide
 *    inside the parentheses, so parentheticals are flattened into the list and
 *    scored, not discarded.
 *  - Filler phrases: "Contains 2% or Less of:", "and/or", "* ", "(for color)".
 *    Stripped before matching so they don't become phantom ingredients.
 *  - Alias sprawl: "FD&C Red No. 40 Lake" and "Allura Red AC" are the same dye.
 *    Resolved by the database's alias index.
 */

import { findIngredient } from "./ingredient-db";
import type { ParsedIngredient } from "./types";

/**
 * Prefixes that carry no ingredient information. Applied repeatedly until the
 * string stops changing, because labels stack them ("and/or organic canola oil").
 */
const PREFIX_NOISE: RegExp[] = [
  /^ingredients?\s*:\s*/,
  /^contains\s+less\s+than\s+\d+(\.\d+)?\s*%\s+(or\s+less\s+)?of\s*[:,]?\s*/,
  /^contains\s+\d+(\.\d+)?\s*%\s+or\s+less\s+of\s*[:,]?\s*/,
  /^\d+(\.\d+)?\s*%\s+or\s+less\s+of\s*[:,]?\s*/,
  /^less\s+than\s+\d+(\.\d+)?\s*%\s+of\s*[:,]?\s*/,
  /^contains\s*[:,]\s*/,
  /^and\s*\/\s*or\s+/,
  /^and\s+/,
  /^or\s+/,
  // "Organic" is a certification claim, not a different ingredient. Organic
  // canola oil is still canola oil, so it is stripped for matching purposes —
  // the organic status of the *product* is handled by Rule 5 instead.
  /^certified\s+organic\s+/,
  /^organic\s+/,
  /^\*+\s*/,
];

/** Trailing phrases that describe why an ingredient is there, not what it is. */
const SUFFIX_NOISE: RegExp[] = [
  /\s+(added\s+)?(for|as)\s+(color|colour|coloring|colouring|flavor|flavour|freshness)$/,
  /\s+to\s+(preserve|protect|maintain|prevent)\b.*$/,
  /\s+as\s+an?\s+(preservative|antioxidant|anticaking\s+agent|anti-caking\s+agent|emulsifier)$/,
  /\s+\(?(color|colour)\s+added\)?$/,
  /\s+for\s+freshness$/,
  /[.*†‡•]+$/,
];

/**
 * Segments that are pure label prose. These appear as their own comma-separated
 * chunks — usually inside parentheses — and must be dropped rather than treated
 * as unknown ingredients, or they would inflate the ingredient count.
 */
const NOISE_SEGMENTS: RegExp[] = [
  /^(made|derived|produced)\s+(from|with)\b/,
  /^(a|an)\s+(preservative|antioxidant|emulsifier|anticaking\s+agent)$/,
  /^(preservative|preservatives|antioxidant|emulsifier|color|colors|colour|colours|coloring|flavoring)$/,
  /^(for|to)\s+/,
  /^(added\s+)?to\s+/,
  /^\d+(\.\d+)?\s*%?$/,
  /^(vitamin|mineral)s?$/,
  /^(and|or|and\s*\/\s*or)$/,
  /^$/,
];

/** Lowercase, de-noise, and collapse whitespace. This is what we match against. */
export function normalizeIngredientName(raw: string): string {
  let name = raw.toLowerCase().trim();

  // Strip prefixes repeatedly — labels stack them.
  let changed = true;
  while (changed) {
    changed = false;
    for (const pattern of PREFIX_NOISE) {
      const next = name.replace(pattern, "");
      if (next !== name) {
        name = next.trim();
        changed = true;
      }
    }
  }

  for (const pattern of SUFFIX_NOISE) {
    name = name.replace(pattern, "").trim();
  }

  // Collapse internal whitespace and drop stray punctuation at the edges.
  return name.replace(/\s+/g, " ").replace(/^[,;:\-–—\s]+|[,;:\-–—\s]+$/g, "").trim();
}

function isNoiseSegment(normalized: string): boolean {
  return NOISE_SEGMENTS.some((pattern) => pattern.test(normalized));
}

/**
 * Split on commas that sit at parenthesis depth zero.
 *
 * "A, B (C, D), E" → ["A", "B (C, D)", "E"]. A naive `split(",")` would tear
 * the sub-list out of B and lose the association.
 */
function splitTopLevel(input: string): string[] {
  const segments: string[] = [];
  let depth = 0;
  let current = "";

  for (const char of input) {
    if (char === "(" || char === "[") depth++;
    else if (char === ")" || char === "]") depth = Math.max(0, depth - 1);

    if (char === "," && depth === 0) {
      segments.push(current);
      current = "";
    } else if (char === ";" && depth === 0) {
      // Some labels separate major components with semicolons.
      segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current);

  return segments.map((s) => s.trim()).filter((s) => s.length > 0);
}

/**
 * Pull a segment apart into its own name and its parenthetical sub-list.
 *
 * "Cheese Sauce Mix (Whey, Salt (Sea Salt))" → head "Cheese Sauce Mix",
 * inner "Whey, Salt (Sea Salt)". Only the outermost parenthetical is split
 * here; deeper nesting is handled by recursion.
 */
function splitHeadAndSubList(segment: string): { head: string; inner: string | null } {
  const open = segment.indexOf("(");
  if (open === -1) return { head: segment.trim(), inner: null };

  let depth = 0;
  for (let i = open; i < segment.length; i++) {
    const char = segment[i];
    if (char === "(") depth++;
    else if (char === ")") {
      depth--;
      if (depth === 0) {
        const head = segment.slice(0, open).trim();
        const inner = segment.slice(open + 1, i).trim();
        const tail = segment.slice(i + 1).trim();
        // A trailing fragment ("Salt (Sea Salt) Powder") is rare; fold it back
        // into the head so nothing is silently dropped.
        return { head: tail ? `${head} ${tail}`.trim() : head, inner: inner || null };
      }
    }
  }

  // Unbalanced parenthesis — treat everything after "(" as the sub-list.
  return { head: segment.slice(0, open).trim(), inner: segment.slice(open + 1).trim() || null };
}

/** Build a ParsedIngredient by looking the name up in the database. */
function toParsedIngredient(
  rawName: string,
  normalized: string,
  position: number,
  isSubIngredient: boolean,
): ParsedIngredient {
  const entry = findIngredient(normalized);

  if (!entry) {
    // Conservative default: an ingredient we don't recognize is not assumed
    // guilty. It scores zero and stays green, but `matched: false` lets the UI
    // (and us) see exactly where the database has gaps.
    return {
      rawName,
      canonicalName: normalized,
      position,
      matched: false,
      flagLevel: "green",
      deductionPoints: 0,
      reason: "Not in the Label Slayer database — scored as neutral.",
      category: "unmatched",
      isSubIngredient,
      countedInScore: true,
    };
  }

  return {
    rawName,
    canonicalName: entry.canonicalName,
    position,
    matched: true,
    flagLevel: entry.flagLevel,
    deductionPoints: entry.deductionPoints,
    reason: entry.reason,
    category: entry.category,
    isSubIngredient,
    countedInScore: true,
  };
}

/**
 * Parse a raw ingredient string into a flat, positioned list.
 *
 * Sub-ingredients are flattened in place: a parent at position 3 is followed by
 * its children at 4, 5, 6. Position 1 is therefore always the true first
 * ingredient on the label — the one Rule 6 cares about.
 */
export function parseIngredients(raw: string): ParsedIngredient[] {
  if (!raw || !raw.trim()) return [];

  const parsed: ParsedIngredient[] = [];
  let position = 0;

  const walk = (input: string, isSub: boolean, parentCategory: string | null, parentFlagged: boolean): void => {
    for (const segment of splitTopLevel(input)) {
      const { head, inner } = splitHeadAndSubList(segment);
      const normalizedHead = normalizeIngredientName(head);

      let category = parentCategory;
      let flagged = parentFlagged;

      if (normalizedHead && !isNoiseSegment(normalizedHead)) {
        position++;
        const ingredient = toParsedIngredient(head.trim(), normalizedHead, position, isSub);

        // A blend and its members are one purchase decision, not several. When
        // "Vegetable Oil (Corn, Canola, and/or Sunflower Oil)" is on the label,
        // charging for the blend AND each oil inside it would punish the same
        // fat three times. So a sub-ingredient in the same category as its
        // *flagged* parent is listed but not charged.
        //
        // The parent must be flagged for this to fire. This rule exists purely to
        // prevent double-charging, and a green ingredient carries no charge — so
        // suppressing green children of a green parent would achieve nothing
        // except deleting the real food from the product, which quietly wrecks
        // the additive-density denominator in Rule 9.
        if (
          isSub &&
          parentCategory &&
          parentFlagged &&
          ingredient.category === parentCategory &&
          ingredient.deductionPoints > 0
        ) {
          ingredient.countedInScore = false;
          ingredient.deductionPoints = 0;
        }

        parsed.push(ingredient);
        category = ingredient.matched ? ingredient.category : parentCategory;
        flagged = ingredient.matched ? ingredient.flagLevel !== "green" : parentFlagged;
      }

      if (inner) walk(inner, true, category, flagged);
    }
  };

  walk(raw, false, null, false);
  return parsed;
}
