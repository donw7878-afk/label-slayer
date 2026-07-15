/**
 * The Slay Writer's engine room: calls the Claude API with the brand voice
 * system prompt and five locked few-shot examples, and returns typed
 * SlayContent.
 *
 * The few-shot examples below ARE the voice standard — adapted from real
 * brand voice samples (July 2026). Every slay the model writes gets measured
 * against them, so treat edits here like brand edits. They deliberately span
 * registers (35 through 92) and categories (beverage, bakery, dip, beauty,
 * coffee) so the voice holds everywhere. Each example's user message mirrors
 * the exact output of formatSlayInput — keep them in sync.
 */

import Anthropic from "@anthropic-ai/sdk";
import type { ScoreResult } from "../scoring";
import type { SlayContent } from "./types";
import { SLAY_WRITER_SYSTEM_PROMPT } from "./system-prompt";
import { formatSlayInput } from "./format-input";

const SLAY_MODEL = "claude-sonnet-4-6";

// ---------------------------------------------------------------------------
// EXAMPLE 1 — Gatorade Lemon-Lime (Score: 35, Sketchy)
// The sports-marketing roast register. Double sugar, petroleum dye, and the
// Celtic Sea Salt upgrade where hydration is the product's whole pitch.
// ---------------------------------------------------------------------------

const GATORADE_INPUT = `Product: Thirst Quencher Lemon-Lime
Brand: Gatorade
Category: Beverage / Sports Drink
Score: 35 / 100
Verdict: Sketchy
Processing Level: Ultra-Processed
Is Organic: No

Deduction Trail:
- Sugar: -8 points — added sugar as the second ingredient (position-weighted)
- Dextrose: -6 points — a second added sugar; pure glucose under a lab name
- Yellow 5: -8 points — synthetic azo dye tied to hyperactivity and allergic reactions; cosmetic only
- Natural Flavor: -3 points — undisclosed flavoring compounds standing in for actual lemon and lime
- Sodium Citrate: -3 points — synthetic electrolyte salt
- Monopotassium Phosphate: -4 points — lab-made electrolyte additive
- Hidden sugar penalty: -3 points — 2 different sweeteners on one label (sugar, dextrose)
- Processing level (ultra-processed): -12 points — formulated beverage built entirely from refined inputs
- Product format (formulated beverage): -10 points — engineered drink, not a recognizable food
- Additive density: -8 points — 6 of 9 ingredients are industrial

Flagged Ingredients (Red):
- Yellow 5: synthetic azo dye, cosmetic only, flagged in several countries

Flagged Ingredients (Amber):
- Sugar: added sugar, second ingredient by weight
- Dextrose: pure glucose under a name most shoppers won't recognize as sugar
- Natural Flavor: undisclosed flavoring compounds
- Sodium Citrate: synthetic electrolyte salt
- Monopotassium Phosphate: lab-made electrolyte additive

Front-of-Package Claims:
- 'Thirst Quencher'
- 'Electrolytes to Help Replace What You Sweat Out'

Total Ingredients: 9
Red Flags: 1
Amber Flags: 5
Sugar Aliases Found: 2

Generate the slay.`;

const GATORADE_SLAY: SlayContent = {
  headline: "Lab juice with a sports contract.",
  summary:
    "Alright, let's wring this one out. Two sugars deep before a single electrolyte shows up, a petroleum dye so it looks like limes were involved, and 'natural flavor' doing the job of actual fruit. You're not hydrating — you're sipping lab juice with fake color, synthetic electrolytes, and enough sugar to make your pancreas sweat.",
  whyThisScore:
    "Start at the top of the label: water, then sugar, then dextrose. Dextrose is glucose in a lab coat — so that's a double sugar dose stacked up front, split across two names so neither one has to sit in the number-two spot alone. In a drink whose entire pitch is health. The hidden-sugar penalty exists for exactly this move.\n\nThen the costume department. Yellow 5 is a petroleum-derived dye that exists so the drink reads 'lemon-lime' to your eyeballs, because nothing else on the label will say it — there is no lemon and no lime in this lemon-lime, just 'natural flavor' shipped in from a flavor house. The electrolytes the bottle brags about are sodium citrate and monopotassium phosphate, lab salts your body was never introduced to. Real salt comes with sixty-plus trace minerals. This comes with a patent vibe.\n\nReal talk: you don't need this unless you're a sweaty linebacker in the fourth quarter of a summer game. For everyone else, it's a soft drink with an athletic department. Water, real fruit, and a pinch of actual mineral salt cover everything this bottle promises, without the dye.",
  marketingSays:
    "'Thirst Quencher' and 'Electrolytes to Help Replace What You Sweat Out.' They're selling you your own sweat back — with two sugars and a refinery color as the delivery fee.",
  labelSays:
    "Water, sugar twice under two names, lab electrolytes, a dye, and an undisclosed flavor packet. The lemon and the lime are both no-shows.",
  redFlagBreakdown: [
    {
      ingredient: "Yellow 5",
      roast:
        "Petroleum-derived dye so the drink looks like limes were consulted. They weren't. Flagged in several countries; here it gets a jersey.",
    },
    {
      ingredient: "Sugar",
      roast:
        "Second ingredient. In a hydration product. The marketing team is doing more cardio than anyone drinking this.",
    },
    {
      ingredient: "Dextrose",
      roast:
        "Sugar's second costume — pure glucose hoping you don't recognize it without the name tag.",
    },
    {
      ingredient: "Natural Flavor",
      roast:
        "The 'trust me, bro' of the ingredient world. No lemon, no lime, just a sealed drum of vibes from a flavor lab.",
    },
    {
      ingredient: "Sodium Citrate",
      roast:
        "A chemistry set's idea of salt. Your body ordered minerals and got a lab receipt.",
    },
    {
      ingredient: "Monopotassium Phosphate",
      roast:
        "Synthetic electrolyte flexing as sports science. A banana does this job and brings fiber as a plus-one.",
    },
  ],
  processingVerdict:
    "Nobody squeezed anything to make this. It was formulated, dyed, and flavored — a beverage built like a spreadsheet.",
  finalWord: "That ain't hydration, that's inflammation.",
  cleanSwapIntro:
    "You can do better without slowing down: water, a real squeeze of citrus, a pinch of Celtic Sea Salt — that ain't just better salt, it's the ancestral upgrade, trace minerals included — and a little honey if you're genuinely sweating for hours. Same electrolytes, zero dye.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 2 — Healthy Life Keto Burger Buns (Score: 39, Sketchy)
// The keto-washing roast: macros check out, chemistry doesn't.
// ---------------------------------------------------------------------------

const KETO_BUNS_INPUT = `Product: Keto Burger Buns
Brand: Healthy Life
Category: Bakery / Bread
Score: 39 / 100
Verdict: Sketchy
Processing Level: Ultra-Processed
Is Organic: No

Deduction Trail:
- Canola Oil: -6 points — industrial seed oil
- Sucralose: -6 points — artificial sweetener linked to gut microbiome concerns
- Calcium Propionate: -5 points — mold-inhibiting preservative
- Mono- and Diglycerides: -5 points — industrial emulsifier that can carry trans fats without declaring them
- Modified Wheat Starch: -4 points — starch processed beyond recognition
- Sorbic Acid: -4 points — second preservative on one label
- Natural Flavor: -2 points — undisclosed flavoring compounds
- Processing level (ultra-processed): -12 points — industrial bakery formulation
- Additive density: -8 points — 7 of 13 ingredients are industrial
- Complexity penalty: -3 points — formulation, not baking

Flagged Ingredients (Red):
- Canola Oil: industrial seed oil, cheap and chemically extracted
- Sucralose: artificial sweetener, flagged for gut microbiome concerns
- Calcium Propionate: mold-inhibiting industrial preservative

Flagged Ingredients (Amber):
- Mono- and Diglycerides: emulsifier that can carry undeclared trans fats
- Modified Wheat Starch: heavily processed starch base
- Sorbic Acid: second preservative
- Natural Flavor: undisclosed flavoring compounds

Front-of-Package Claims:
- 'Keto Certified'
- '2g Net Carbs'
- 'Healthy Life'

Total Ingredients: 13
Red Flags: 3
Amber Flags: 4
Sugar Aliases Found: 0

Generate the slay.`;

const KETO_BUNS_SLAY: SlayContent = {
  headline: "Keto by math. Lab loaf by birth.",
  summary:
    "Buckle up, keto fam. The carb count checks out — the chemistry is another story. Low-carb don't mean low-chemical, and this is a processed lab loaf dipped in preservatives and seed oil slime, wearing a 'Healthy Life' name tag like that settles it.",
  whyThisScore:
    "The skeleton of this bun is modified wheat starch — wheat that's been processed so far past flour it legally needs a new name — held together with canola oil, the industrial seed oil that shows up wherever a manufacturer needs cheap fat that won't complain. That's the foundation. Everything else is maintenance.\n\nAnd the maintenance department is fully staffed: calcium propionate to keep mold away, sorbic acid as backup because apparently one preservative wasn't enough insurance on a bun, mono- and diglycerides to keep the crumb from separating, and sucralose to sweeten a bread that has no sugar to confess. This bun is preserved like it has somewhere to be in 2029. Bread your great-grandmother made went stale in two days, and that was the point — it was food.\n\nReal talk: if you're keto and you need a bun, this will technically do the job the macros promise. But 'keto certified' measures carbs, not quality — the certification doesn't know what canola oil is. There are cleaner ways to hit the same number, and most of them involve a mixing bowl.",
  marketingSays:
    "'Keto Certified,' '2g Net Carbs,' and a brand literally named 'Healthy Life.' That's keto-washing — hit the macro, skip the food, and let the certification do the talking.",
  labelSays:
    "Modified starch, industrial oil, two preservatives, an emulsifier, and a fake sweetener. The label reads like a maintenance schedule, not a recipe.",
  redFlagBreakdown: [
    {
      ingredient: "Canola Oil",
      roast:
        "The ex that keeps texting your metabolism at 2am. Industrial, cheap, chemically extracted, and somehow in everything.",
    },
    {
      ingredient: "Sucralose",
      roast:
        "Sweetness with no calories and no fans downstairs. Your gut bacteria read the label and said 'we out.'",
    },
    {
      ingredient: "Calcium Propionate",
      roast:
        "The preservative keeping this bun 'fresh' for weeks. Mold doesn't even want this bun, and mold has famously low standards.",
    },
    {
      ingredient: "Mono- and Diglycerides",
      roast:
        "Emulsifiers that can smuggle trans-fat energy past the label police. They got in the club, but they were never on the real-food list.",
    },
    {
      ingredient: "Modified Wheat Starch",
      roast:
        "Wheat that's been through so much it changed its name and moved states.",
    },
    {
      ingredient: "Sorbic Acid",
      roast:
        "The second preservative. When one bodyguard isn't enough, ask what the bun is so afraid of.",
    },
    {
      ingredient: "Natural Flavor",
      roast: "Flavor from a drum, name from a meadow.",
    },
  ],
  processingVerdict:
    "Extruded, emulsified, and preserved — this came off a production line, not out of an oven anyone would recognize.",
  finalWord: "Mold won't touch this bun. Let that sink in before you do.",
  cleanSwapIntro:
    "You can do better, keto or not. If carbs aren't actually your enemy, a real sourdough from a real bakery has four ingredients. If they are: homemade almond-flour buns — almond flour, eggs, psyllium husk, baking powder, pinch of Celtic Sea Salt, 25 minutes at 350. No lab required.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 3 — Kirkland Organic Guacamole (Score: 90, Slayer Approved)
// Genuine respect with swagger. Brief. One gentle amber note, no manufactured
// outrage.
// ---------------------------------------------------------------------------

const GUAC_INPUT = `Product: Organic Guacamole
Brand: Kirkland Signature
Category: Food / Dip
Score: 90 / 100
Verdict: Slayer Approved
Processing Level: Moderately Processed
Is Organic: Yes

Deduction Trail:
- Citric Acid: -2 points — lab-produced acidulant, used here to keep the avocado from browning
- Processing level (moderately processed): -5 points — commercially mashed, seasoned, and sealed
- Additive density: -3 points — 1 of 9 ingredients is industrial

Flagged Ingredients (Red):
- None

Flagged Ingredients (Amber):
- Citric Acid: lab-produced acidulant, anti-browning agent

Front-of-Package Claims:
- 'Organic'

Total Ingredients: 9
Red Flags: 0
Amber Flags: 1
Sugar Aliases Found: 0

Generate the slay.`;

const GUAC_SLAY: SlayContent = {
  headline: "Guac with nothing to confess.",
  summary:
    "Alright, hand it over — let's see what Costco's hiding. Turns out: nothing. Zero seed oils, zero added sugars, and every flavor ingredient your abuela would've used if she had to mass-produce guacamole.",
  whyThisScore:
    "Read the list: organic avocados first and overwhelmingly, then real onion, jalapeño, lime, garlic, cilantro, salt. That's not an ingredient list, that's a recipe. The lime is doing double duty as flavor and preservation, which is how this was handled for a few thousand years before anyone invented a preservative aisle.\n\nThe two points off the top are citric acid — the only ingredient here with a lab coat, and its whole job is keeping the avocado green in transit. The rest of the deduction is just the reality of a factory dip: mashed and sealed at scale instead of in your kitchen. That's a ceiling, not a crime.\n\nReal talk: this is real food in a plastic tub. Organic produce, actual aromatics, and a preservation strategy that's mostly just lime with one lab assist. For store-bought guacamole at warehouse scale, it doesn't get much cleaner than this.",
  marketingSays:
    "'Organic.' One claim, and for once the front of the package and the back are telling the same story.",
  labelSays:
    "Avocados, vegetables, lime, salt, and one anti-browning assist. A recipe, not a formulation.",
  redFlagBreakdown: [
    {
      ingredient: "Citric Acid",
      roast:
        "The only ingredient here with a lab coat, and it's just keeping the avocado green. We'll allow it.",
    },
  ],
  processingVerdict:
    "Mashed, seasoned, sealed. Processing a kitchen would recognize.",
  finalWord: "That's right — it's struttin' high for a reason.",
  cleanSwapIntro:
    "No swap needed — this is the shelf doing its job. Want the perfect version anyway? Two avocados, half a lime, diced onion, cilantro, pinch of Celtic Sea Salt. Five minutes, zero tub.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 4 — SEKKISEI Cream Excellent (Score: 45, Sketchy)
// Beauty products get the same treatment — this example proves the range.
// ---------------------------------------------------------------------------

const SEKKISEI_INPUT = `Product: Cream Excellent
Brand: SEKKISEI
Category: Beauty / Skincare
Score: 45 / 100
Verdict: Sketchy
Processing Level: Heavily Processed
Is Organic: No

Deduction Trail:
- Alcohol: -8 points — drying solvent, third ingredient by weight (position-weighted)
- Methylparaben: -6 points — preservative flagged as an endocrine question mark; restricted in some markets
- Propylparaben: -6 points — second paraben, restricted in several markets
- Fragrance: -6 points — one word legally hiding dozens of undisclosed compounds
- PEG-40 Hydrogenated Castor Oil: -5 points — penetration-enhancing emulsifier
- Dimethicone: -4 points — occlusive silicone; cosmetic smoothing only
- Processing level (heavily processed): -10 points — solvent-and-silicone formulation over an herbal base
- Additive density: -10 points — 6 of 12 ingredients are industrial

Flagged Ingredients (Red):
- Methylparaben: preservative flagged for endocrine concerns, restricted in some markets
- Propylparaben: second paraben preservative, restricted in several markets
- Fragrance: undisclosed compound blend

Flagged Ingredients (Amber):
- Alcohol: drying solvent, high on the label
- Dimethicone: occlusive silicone, cosmetic effect only
- PEG-40 Hydrogenated Castor Oil: penetration-enhancing emulsifier

Front-of-Package Claims:
- 'Herbal Beauty Essence'
- 'Translucent Skin'

Total Ingredients: 12
Red Flags: 3
Amber Flags: 3
Sugar Aliases Found: 0

Generate the slay.`;

const SEKKISEI_SLAY: SlayContent = {
  headline: "A beautiful herbal recipe, mugged in the lab parking lot.",
  summary:
    "Let's strip this one down — skincare labels play by the same rules as food labels, and this one's a tragedy in two acts. There's a genuinely solid herbal backbone here: Job's tears, angelica root, real plant extracts with centuries of receipts. Then somebody drowned it in alcohol, two parabens, a PEG, and mystery fragrance. It's like cooking a beautiful grass-fed steak and then dousing it in Axe body spray.",
  whyThisScore:
    "Give credit first: the herbal core of this cream is real. Coix seed — Job's tears — and angelica root aren't marketing garnish; they're extracts with a long traditional track record for skin. If the label stopped there, this thing scores in the eighties.\n\nIt does not stop there. Alcohol is the third ingredient — there to make the cream feel weightless, achieved by drying the very skin the herbs came to help. Then the preservation is handled by a paraben double act, methylparaben and propylparaben, both carrying endocrine question marks and restrictions in multiple markets. PEG-40 helps everything absorb more deeply — including the things you'd rather stayed on the surface — and 'fragrance' is one word legally hiding a compound list longer than the one printed. Dimethicone smooths it all over so the mirror tells you it worked.\n\nReal talk: the plants in this jar deserve better management. If your skin tolerates it, you'll see a temporary glow — that's the silicone, not the herbs. There are herbal creams with modern preservation systems that deliver the same tradition without the 2003 chemistry.",
  marketingSays:
    "'Herbal Beauty Essence' and 'Translucent Skin.' The front sells you the garden. The back delivers the garden plus the chemical shed behind it.",
  labelSays:
    "Water, glycerin, then alcohol before a single herb shows up — followed by the actual plants, then silicones, a PEG, two parabens, and an undisclosed fragrance blend riding shotgun.",
  redFlagBreakdown: [
    {
      ingredient: "Methylparaben",
      roast:
        "A preservative flagged as an endocrine question mark. Your face deserves declarative sentences.",
    },
    {
      ingredient: "Propylparaben",
      roast:
        "The second paraben — restricted in several markets, still headlining in this jar.",
    },
    {
      ingredient: "Fragrance",
      roast:
        "One word, legally allowed to hide dozens of compounds. The 'trust me, bro' of the beauty aisle.",
    },
    {
      ingredient: "Alcohol",
      roast:
        "Third ingredient. It makes the cream feel light — by drying the skin the herbs were hired to help. Sabotage from inside the building.",
    },
    {
      ingredient: "Dimethicone",
      roast:
        "Silicone gloss — a smoothing filter for your face. Looks great in the moment, changes nothing underneath.",
    },
    {
      ingredient: "PEG-40 Hydrogenated Castor Oil",
      roast:
        "The doorman who waves everything through — including the guests you specifically didn't invite.",
    },
  ],
  processingVerdict:
    "Formulated like it's 2003 — silicone shine and paraben insurance layered over an herbal heart.",
  finalWord: "Good herbs. Wrong bodyguards.",
  cleanSwapIntro:
    "You can do better without abandoning the tradition: look for herbal creams that preserve with modern systems and say 'fragrance-free' on the front — or go simple with squalane plus the actual extract you wanted in the first place.",
};

// ---------------------------------------------------------------------------
// EXAMPLE 5 — Café Bustelo Espresso (Score: 92, Slayer Approved)
// High score, brief, honest about the small ceiling without inflating it.
// ---------------------------------------------------------------------------

const BUSTELO_INPUT = `Product: Espresso Style Dark Roast Ground Coffee
Brand: Café Bustelo
Category: Beverage / Coffee
Score: 92 / 100
Verdict: Slayer Approved
Processing Level: Minimally Processed
Is Organic: No

Deduction Trail:
- Non-organic conventional sourcing: -8 points — conventional coffee is a heavily sprayed crop; organic certification would lift the cap

Flagged Ingredients (Red):
- None

Flagged Ingredients (Amber):
- None

Front-of-Package Claims:
- 'Espresso Style'
- '100% Pure Coffee'

Total Ingredients: 1
Red Flags: 0
Amber Flags: 0
Sugar Aliases Found: 0

Generate the slay.`;

const BUSTELO_SLAY: SlayContent = {
  headline: "One ingredient. It's coffee. We're done here.",
  summary:
    "Alright, this one's quick. The ingredient list says coffee. That's the list. No additives, no preservatives, no 'flavor system' — just beans roasted dark enough to mean it.",
  whyThisScore:
    "Single ingredient, and the front of the package and the back are in complete agreement — '100% Pure Coffee' is somehow both a marketing claim and a plain fact. The eight missing points are a ceiling, not a crime: conventional coffee is one of the more heavily sprayed crops on earth, and these beans carry that farming history. Organic certification is the only thing between this and the high nineties.\n\nReal talk: this is exactly what a coffee label should look like, at a price that doesn't require a second job. If it's your daily cup, organic shade-grown beans are a genuine upgrade worth the money. If it's not, drink this without a second thought.",
  marketingSays:
    "'Espresso Style' and '100% Pure Coffee.' Both just true. Refreshing, honestly.",
  labelSays: "Coffee. That's it. That's the label.",
  redFlagBreakdown: [],
  processingVerdict:
    "Roasted and ground — the same processing coffee got two hundred years ago.",
  finalWord: "Single ingredient, zero apologies. More labels should be this boring.",
  cleanSwapIntro:
    "No swap needed — but if you want the last eight points, organic shade-grown beans are the move. Same ritual, cleaner crop.",
};

// ---------------------------------------------------------------------------
// Few-shot message history. Assistant turns are the exact JSON we expect back.
// ---------------------------------------------------------------------------

const FEW_SHOT_MESSAGES: Anthropic.MessageParam[] = [
  { role: "user", content: GATORADE_INPUT },
  { role: "assistant", content: JSON.stringify(GATORADE_SLAY, null, 2) },
  { role: "user", content: KETO_BUNS_INPUT },
  { role: "assistant", content: JSON.stringify(KETO_BUNS_SLAY, null, 2) },
  { role: "user", content: GUAC_INPUT },
  { role: "assistant", content: JSON.stringify(GUAC_SLAY, null, 2) },
  { role: "user", content: SEKKISEI_INPUT },
  { role: "assistant", content: JSON.stringify(SEKKISEI_SLAY, null, 2) },
  { role: "user", content: BUSTELO_INPUT },
  { role: "assistant", content: JSON.stringify(BUSTELO_SLAY, null, 2) },
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
