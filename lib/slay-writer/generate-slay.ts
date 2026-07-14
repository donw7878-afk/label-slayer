/**
 * The Slay Writer's engine room: calls the Claude API with the brand voice
 * system prompt and three locked few-shot examples, and returns typed
 * SlayContent.
 *
 * The few-shot examples below ARE the voice standard. Every slay the model
 * writes gets measured against them, so treat edits here like brand edits.
 * Each example's user message mirrors the exact output of formatSlayInput —
 * keep them in sync.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScoreResult } from "../scoring";
import type { SlayContent } from "./types";
import { SLAY_WRITER_SYSTEM_PROMPT } from "./system-prompt";
import { formatSlayInput } from "./format-input";

const SLAY_MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// EXAMPLE 1 — Kraft Mac & Cheese (Score: 45, Sketchy)
// The mid-range register: sarcasm is awake, but the product gets credit for
// the things it genuinely fixed (Kraft dropped synthetic dyes in 2016).
// ---------------------------------------------------------------------------

const KRAFT_INPUT = `Product: Original Macaroni & Cheese Dinner
Brand: Kraft
Category: Boxed Meal / Pasta
Score: 45 / 100
Verdict: Sketchy
Processing Level: Ultra-Processed
Is Organic: No

Deduction Trail:
- Sodium Triphosphate: -6 points — industrial phosphate used to keep dehydrated cheese powder stable and pourable
- Sodium Phosphate: -5 points — phosphate additive; intake from processed food linked to concerns
- Calcium Phosphate: -5 points — third phosphate on one label; anti-caking and texture agent
- Enriched Wheat Flour: -4 points — refined grain, nutrients stripped in milling and re-added synthetically
- Milk Protein Concentrate: -3 points — highly processed dairy fraction standing in for cheese
- Processing level (ultra-processed): -12 points — powdered sauce system on a refined-grain base with multiple industrial additives
- Product format (powdered): -10 points — the cheese sauce is a spray-dried powder, a transformation the ingredient list never admits to
- Additive density: -5 points — 5 flagged ingredients across a 22-ingredient label
- Non-organic conventional sourcing: -5 points — conventional ingredients cap the ceiling

Flagged Ingredients (Red):
- Sodium Triphosphate: industrial phosphate stabilizer
- Sodium Phosphate: phosphate additive, flagged at processed-food intake levels
- Calcium Phosphate: phosphate anti-caking agent

Flagged Ingredients (Amber):
- Enriched Wheat Flour: refined flour with synthetic nutrient re-addition
- Milk Protein Concentrate: processed dairy fraction used as a cheese substitute

Front-of-Package Claims:
- 'The Taste You Love'
- 'No Artificial Flavors, Preservatives, or Dyes'

Total Ingredients: 22
Red Flags: 3
Amber Flags: 2
Sugar Aliases Found: 0

Generate the slay.`;

const KRAFT_SLAY: SlayContent = {
  headline: "Macaroni with a chemistry degree.",
  summary:
    "Look — it's a blue box. Everyone knows what this is. But 'cheese product' and 'processed' are doing a lot of heavy lifting on that ingredient list, and the fact that the sauce comes as powder should tell you everything about how 'real' this cheese situation is.",
  whyThisScore:
    "Start with what's actually in the box: refined wheat macaroni and a foil pouch of cheese dust. Getting cheese to survive as a shelf-stable powder takes work — specifically three different phosphates (sodium triphosphate, sodium phosphate, calcium phosphate) doing jobs that cheese never asked for. One phosphate is maintenance. Three is a committee.\n\nCredit where it's due: no synthetic dyes. The orange comes from paprika, turmeric, and annatto — plants, not petroleum — and that's the main reason this lands at 45 instead of somewhere in the twenties. But the pasta is stripped white flour with the vitamins bolted back on at the factory, the closest thing to cheese here is milk protein concentrate and whey, and the entire sauce arrives dehydrated. The score reflects a product that fixed the small lies and kept the big one.",
  marketingSays:
    "The box leans on 'The Taste You Love' and 'No Artificial Flavors, Preservatives, or Dyes.' Both technically true. Notice what it doesn't mention: anything about what the cheese has been through to become a powder.",
  labelSays:
    "The label says the sauce is a spray-dried dust held together by three phosphates, the pasta is refined flour with the nutrition re-installed after milling removed it, and actual cheese is more of a theme than an ingredient. It isn't lying. It's just quietly hoping you stop reading after 'macaroni.'",
  redFlagBreakdown: [
    {
      ingredient: "Sodium Triphosphate",
      roast:
        "One phosphate keeps cheese powder pourable. Kraft needed three. Ask yourself what the cheese did to deserve this.",
    },
    {
      ingredient: "Sodium Phosphate",
      roast:
        "The second phosphate. At this point they're not stabilizing cheese, they're embalming it.",
    },
    {
      ingredient: "Calcium Phosphate",
      roast:
        "Phosphate number three, on one label. Even bad decisions usually stop at two.",
    },
    {
      ingredient: "Enriched Wheat Flour",
      roast:
        "They strip the flour, then add the vitamins back and call it 'enriched.' That's returning a stolen wallet and expecting a thank-you card.",
    },
    {
      ingredient: "Milk Protein Concentrate",
      roast:
        "Cheese-adjacent, the way a stock photo of a family is family-adjacent.",
    },
  ],
  processingVerdict:
    "The cheese is a powder. Cheese does not become a powder by accident — that's a factory decision, and it's one the ingredient list never has to admit to.",
  finalWord:
    "Kraft cleaned up the dyes and kept the powder. That's not reform. That's a haircut.",
  cleanSwapIntro:
    "If you'd like mac and cheese where the cheese has been cheese the whole time, here's where to look.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 2 — Coca-Cola Classic (Score: 12, Toxic Trash)
// Full roast mode. This is the register where the personality shines hardest.
// ---------------------------------------------------------------------------

const COKE_INPUT = `Product: Coca-Cola Classic
Brand: Coca-Cola
Category: Beverage / Soda
Score: 12 / 100
Verdict: Toxic Trash
Processing Level: Ultra-Processed
Is Organic: No

Deduction Trail:
- High Fructose Corn Syrup: -18 points — refined liquid sweetener as the first ingredient after water (position-weighted)
- Caramel Color: -8 points — industrial coloring agent; certain manufacturing methods restricted abroad
- Phosphoric Acid: -6 points — industrial acidulant used to mask sweetness
- Natural Flavors: -4 points — undisclosed proprietary flavoring compounds
- Processing level (ultra-processed): -12 points — formulated beverage with no whole-food ingredients
- Product format (formulated beverage): -10 points — engineered drink, not a recognizable food
- Sweetener-vehicle cap: -30 points — a sweetener leads the non-water ingredients; score capped

Flagged Ingredients (Red):
- High Fructose Corn Syrup: refined liquid sweetener, heavily flagged at this label position
- Caramel Color: industrial coloring agent
- Phosphoric Acid: industrial acidulant

Flagged Ingredients (Amber):
- Natural Flavors: undisclosed flavoring compounds
- Caffeine: added stimulant

Front-of-Package Claims:
- 'Original Taste'

Total Ingredients: 6
Red Flags: 3
Amber Flags: 2
Sugar Aliases Found: 1
Note: A sweetener leads the non-water ingredients — this product is primarily a sugar-delivery vehicle.

Generate the slay.`;

const COKE_SLAY: SlayContent = {
  headline: "Carbonated regret in a red can.",
  summary:
    "It's sugar water. That's it. That's the whole product. The caramel color is there to make sugar water look like it has a personality, and the 'natural flavors' are there because 'we're not telling you' tested better in focus groups.",
  whyThisScore:
    "Set the fizzy water aside and the first real ingredient is high fructose corn syrup. That makes this a sugar-delivery vehicle by the engine's own math, and the score caps accordingly. Everything after the syrup is staff: caramel color so the sugar water looks serious, phosphoric acid so it doesn't taste like syrup, caffeine so you come back tomorrow.\n\nSix ingredients sounds restrained until you look at what they are. 'Natural flavors' is a recipe hiding behind a legal curtain — undisclosed by design, and it's been undisclosed since 1886. Caramel color is pure costume. Phosphoric acid is doing the job your taste buds would otherwise do, which is telling you this is far too sweet. A 12 isn't harsh. A 12 is generous, and only because nothing in here is pretending to be food.",
  marketingSays:
    "The can promises 'Original Taste' — heritage, nostalgia, a polar bear if it's winter. What that phrase actually describes is the world's most successful sugar-water recipe, unchanged because it works.",
  labelSays:
    "Water, syrup, costume, acid, secret, caffeine. That's the entire list. The label is six words long and still manages to withhold the recipe.",
  redFlagBreakdown: [
    {
      ingredient: "High Fructose Corn Syrup",
      roast:
        "The main event — everything else in the can works for the syrup. Your pancreas just filed a restraining order.",
    },
    {
      ingredient: "Caramel Color",
      roast:
        "Pure costume. Without it you'd be drinking pale sugar water and asking yourself harder questions.",
    },
    {
      ingredient: "Phosphoric Acid",
      roast:
        "Added to cut the sweetness so you can't taste how much sugar you're actually drinking. That's not a flavor. That's a cover-up.",
    },
    {
      ingredient: "Natural Flavors",
      roast:
        "The recipe is a secret. It's been a secret for 140 years. At some point 'mysterious' just means 'hiding.'",
    },
    {
      ingredient: "Caffeine",
      roast: "The loyalty program.",
    },
  ],
  processingVerdict:
    "Nobody cooked this. It was formulated — engineered down to the acid level so the sugar goes down smooth, and it shows.",
  finalWord:
    "This isn't a drink with sugar in it. It's sugar with a drink around it.",
  cleanSwapIntro:
    "If it's the fizz you're after and not the syrup, there are honest ways to get it.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 3 — Organic EVOO (Score: 100, Slayer Approved)
// Genuine respect. Brief. Not trying to be funny — the product earned a
// straight answer.
// ---------------------------------------------------------------------------

const EVOO_INPUT = `Product: Organic Cold-Pressed Extra Virgin Olive Oil
Brand: Generic
Category: Pantry / Cooking Oil
Score: 100 / 100
Verdict: Slayer Approved
Processing Level: Minimally Processed
Is Organic: Yes

Deduction Trail:
- None. Nothing to deduct.

Flagged Ingredients (Red):
- None

Flagged Ingredients (Amber):
- None

Front-of-Package Claims:
- 'Organic'
- 'Cold-Pressed'

Total Ingredients: 1
Red Flags: 0
Amber Flags: 0
Sugar Aliases Found: 0

Generate the slay.`;

const EVOO_SLAY: SlayContent = {
  headline: "One ingredient. Zero games.",
  summary:
    "Organic extra virgin olive oil. That's the ingredient list. That's the review. Your great-grandparents would recognize every word on this label, mostly because there's only one.",
  whyThisScore:
    "There's nothing to deduct. One ingredient, organically grown, cold-pressed — which means the oil was squeezed out of olives rather than chemically extracted from them. The label and the product are the same thing. That's the entire trick, and almost nobody in the aisle manages it.\n\nNo fillers, no flavor systems, no colors, nothing to stabilize because nothing is unstable. People were making this three thousand years ago without a chemistry department, and the recipe hasn't needed a single addition since. It scores 100 because the engine found nothing to argue with. Neither do we.",
  marketingSays:
    "The front says 'Organic' and 'Cold-Pressed.' Two claims, both of them just descriptions of what's in the bottle.",
  labelSays:
    "The back says organic cold-pressed extra virgin olive oil. The front and the back are telling the same story. Frame it.",
  redFlagBreakdown: [],
  processingVerdict:
    "Minimally processed in the oldest sense — pressed, bottled, done.",
  finalWord: "Nothing to hide. That's how it should be.",
  cleanSwapIntro:
    "No swap needed — this is what the swaps are for. If it's already in your kitchen, carry on.",
};

// ---------------------------------------------------------------------------
// Few-shot message history. Assistant turns are the exact JSON we expect back.
// ---------------------------------------------------------------------------

const FEW_SHOT_MESSAGES: Anthropic.MessageParam[] = [
  { role: "user", content: KRAFT_INPUT },
  { role: "assistant", content: JSON.stringify(KRAFT_SLAY, null, 2) },
  { role: "user", content: COKE_INPUT },
  { role: "assistant", content: JSON.stringify(COKE_SLAY, null, 2) },
  { role: "user", content: EVOO_INPUT },
  { role: "assistant", content: JSON.stringify(EVOO_SLAY, null, 2) },
];

// ---------------------------------------------------------------------------
// Response parsing
// ---------------------------------------------------------------------------

const STRING_FIELDS = [
  "headline",
  "summary",
  "whyThisScore",
  "marketingSays",
  "labelSays",
  "processingVerdict",
  "finalWord",
  "cleanSwapIntro",
] as const;

function parseSlayContent(raw: string): SlayContent {
  // The prompt forbids fences, but a stray wrapper shouldn't sink the parse:
  // take everything from the first "{" to the last "}".
  const start = raw.indexOf("{");
  const end = raw.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`Slay Writer returned no JSON object:\n${raw}`);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw.slice(start, end + 1));
  } catch (err) {
    throw new Error(
      `Slay Writer returned malformed JSON: ${(err as Error).message}\n${raw}`,
    );
  }

  const obj = parsed as Record<string, unknown>;
  for (const field of STRING_FIELDS) {
    if (typeof obj[field] !== "string" || obj[field] === "") {
      throw new Error(`Slay Writer response is missing "${field}"`);
    }
  }
  if (
    !Array.isArray(obj.redFlagBreakdown) ||
    obj.redFlagBreakdown.some(
      (entry) =>
        typeof entry !== "object" ||
        entry === null ||
        typeof (entry as Record<string, unknown>).ingredient !== "string" ||
        typeof (entry as Record<string, unknown>).roast !== "string",
    )
  ) {
    throw new Error(
      'Slay Writer response has an invalid "redFlagBreakdown" array',
    );
  }

  return obj as unknown as SlayContent;
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

export async function generateSlay(
  productName: string,
  brand: string,
  category: string,
  scoreResult: ScoreResult,
  frontOfPackageClaims?: string[],
): Promise<SlayContent> {
  // Constructed per call so a missing ANTHROPIC_API_KEY fails here, with a
  // clear SDK error, rather than at module import.
  const client = new Anthropic();

  const response = await client.messages.create({
    model: SLAY_MODEL,
    max_tokens: 16000,
    system: SLAY_WRITER_SYSTEM_PROMPT,
    messages: [
      ...FEW_SHOT_MESSAGES,
      {
        role: "user",
        content: formatSlayInput(
          productName,
          brand,
          category,
          scoreResult,
          frontOfPackageClaims,
        ),
      },
    ],
  });

  if (response.stop_reason === "refusal") {
    throw new Error(
      `Slay Writer request was refused for "${productName}" — check the input for anything resembling a policy issue.`,
    );
  }

  const text = response.content
    .filter((block) => block.type === "text")
    .map((block) => block.text)
    .join("");

  return parseSlayContent(text);
}
