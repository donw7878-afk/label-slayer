/**
 * Master ingredient database.
 *
 * Every entry is hand-assigned a flag level and a deduction. The numbers are
 * editorial judgments, not lab values — they encode how much a given ingredient
 * should cost a product's score. Keep them here so tuning the engine never
 * means touching the engine.
 *
 * Rules of the road when adding entries:
 *  - canonicalName is lowercase and is what the score trail displays.
 *  - alternateNames must cover every spelling a real label uses. Matching is
 *    done on these, so a missing alias means a missed flag.
 *  - Deductions are per distinct ingredient. The engine never charges the same
 *    canonical ingredient twice.
 */

import type { IngredientEntry } from "./types";

export const INGREDIENT_DB: IngredientEntry[] = [
  // ───────────────────────────────────────────────────────────────────────────
  // SYNTHETIC DYES — red, 8
  // Petroleum-derived colorants that exist purely to make processed food look
  // like food. Several are banned or require warning labels in the EU.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "red 40",
    alternateNames: [
      "red 40",
      "red no. 40",
      "red #40",
      "fd&c red no. 40",
      "fd&c red 40",
      "fd&c red #40",
      "allura red",
      "allura red ac",
      "red 40 lake",
      "fd&c red no. 40 lake",
      "e129",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Petroleum-derived dye linked to hyperactivity in children. Purely cosmetic.",
    bannedInCountries: ["EU (warning label required)"],
  },
  {
    canonicalName: "yellow 5",
    alternateNames: [
      "yellow 5",
      "yellow no. 5",
      "yellow #5",
      "fd&c yellow no. 5",
      "fd&c yellow 5",
      "fd&c yellow #5",
      "tartrazine",
      "yellow 5 lake",
      "fd&c yellow no. 5 lake",
      "e102",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Synthetic azo dye tied to hyperactivity and allergic reactions. Cosmetic only.",
    bannedInCountries: ["EU (warning label required)"],
  },
  {
    canonicalName: "yellow 6",
    alternateNames: [
      "yellow 6",
      "yellow no. 6",
      "yellow #6",
      "fd&c yellow no. 6",
      "fd&c yellow 6",
      "fd&c yellow #6",
      "sunset yellow",
      "sunset yellow fcf",
      "yellow 6 lake",
      "e110",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Synthetic dye with benzidine contamination concerns. Adds nothing but color.",
    bannedInCountries: ["EU (warning label required)"],
  },
  {
    canonicalName: "blue 1",
    alternateNames: [
      "blue 1",
      "blue no. 1",
      "blue #1",
      "fd&c blue no. 1",
      "fd&c blue 1",
      "brilliant blue",
      "brilliant blue fcf",
      "blue 1 lake",
      "e133",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Coal-tar derived dye. No nutritional purpose whatsoever.",
  },
  {
    canonicalName: "blue 2",
    alternateNames: [
      "blue 2",
      "blue no. 2",
      "blue #2",
      "fd&c blue no. 2",
      "fd&c blue 2",
      "indigo carmine",
      "indigotine",
      "e132",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Synthetic dye with tumor findings in animal studies. Cosmetic only.",
  },
  {
    canonicalName: "red 3",
    alternateNames: [
      "red 3",
      "red no. 3",
      "red #3",
      "fd&c red no. 3",
      "fd&c red 3",
      "erythrosine",
      "e127",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Banned in cosmetics since 1990 for carcinogenicity, then left in food for decades.",
    bannedInCountries: ["US (revoked for food, phase-out through 2027)"],
  },
  {
    canonicalName: "green 3",
    alternateNames: [
      "green 3",
      "green no. 3",
      "green #3",
      "fd&c green no. 3",
      "fd&c green 3",
      "fast green",
      "fast green fcf",
      "e143",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Synthetic dye banned across the EU. Exists to tint, nothing more.",
    bannedInCountries: ["EU"],
  },
  {
    canonicalName: "titanium dioxide",
    alternateNames: ["titanium dioxide", "ci 77891", "e171"],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Whitening agent the EU banned over genotoxicity concerns. Still legal in the US.",
    bannedInCountries: ["EU", "France"],
  },
  {
    canonicalName: "caramel color",
    alternateNames: [
      "caramel color",
      "caramel colour",
      "caramel coloring",
      "class iii caramel",
      "class iv caramel",
      "e150c",
      "e150d",
    ],
    category: "synthetic-dye",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Ammonia-process caramel (Class III/IV) carries 4-MEI, a listed carcinogen in California.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // ARTIFICIAL SWEETENERS — red, 7
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "aspartame",
    alternateNames: ["aspartame", "nutrasweet", "equal", "e951"],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Classified by the WHO's IARC as possibly carcinogenic to humans (2023).",
  },
  {
    canonicalName: "sucralose",
    alternateNames: ["sucralose", "splenda", "e955"],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Chlorinated sweetener shown to alter gut microbiota; breaks down when heated.",
  },
  {
    canonicalName: "acesulfame potassium",
    alternateNames: [
      "acesulfame potassium",
      "acesulfame k",
      "acesulfame-k",
      "ace-k",
      "ace k",
      "potassium acesulfame",
      "e950",
    ],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Synthetic sweetener approved on thin, dated safety data. Almost always paired with another.",
  },
  {
    canonicalName: "saccharin",
    alternateNames: ["saccharin", "sodium saccharin", "sweet'n low", "e954"],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Once carried a cancer warning label. Still an industrial sweetener, not food.",
  },
  {
    canonicalName: "neotame",
    alternateNames: ["neotame", "e961"],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Aspartame derivative, 8,000x sweeter than sugar. Recent research flags gut-lining damage.",
  },
  {
    canonicalName: "advantame",
    alternateNames: ["advantame", "e969"],
    category: "artificial-sweetener",
    flagLevel: "red",
    deductionPoints: 7,
    reason: "Aspartame derivative, 20,000x sweeter than sugar. Minimal long-term human data.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CONTROVERSIAL PRESERVATIVES
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "bht",
    alternateNames: ["bht", "butylated hydroxytoluene", "e321"],
    category: "preservative",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Synthetic antioxidant with endocrine-disruption signals. Banned from food in Japan.",
    bannedInCountries: ["Japan"],
  },
  {
    canonicalName: "bha",
    alternateNames: ["bha", "butylated hydroxyanisole", "e320"],
    category: "preservative",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Listed as reasonably anticipated to be a human carcinogen by the US NTP.",
    bannedInCountries: ["EU (restricted)", "Japan"],
  },
  {
    canonicalName: "tbhq",
    alternateNames: ["tbhq", "tertiary butylhydroquinone", "tert-butylhydroquinone", "e319"],
    category: "preservative",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Petroleum-derived preservative shown to impair immune response in animal studies.",
  },
  {
    canonicalName: "sodium nitrite",
    alternateNames: ["sodium nitrite", "e250"],
    category: "preservative",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Forms nitrosamines under heat — the mechanism behind processed-meat cancer risk.",
  },
  {
    canonicalName: "sodium nitrate",
    alternateNames: ["sodium nitrate", "e251"],
    category: "preservative",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Converts to nitrite in the body, then to nitrosamines. Same story, one step back.",
  },
  {
    canonicalName: "sodium benzoate",
    alternateNames: ["sodium benzoate", "benzoate of soda", "e211"],
    category: "preservative",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Forms benzene when combined with vitamin C. Common, but not harmless.",
  },
  {
    canonicalName: "potassium sorbate",
    alternateNames: ["potassium sorbate", "e202"],
    category: "preservative",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Among the milder synthetic preservatives, but still a shelf-life chemical.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SEED OILS — red, 6
  // Industrially extracted, hexane-washed, oxidation-prone, and everywhere.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "canola oil",
    alternateNames: [
      "canola oil",
      "canola",
      "rapeseed oil",
      "low erucic acid rapeseed oil",
      "expeller pressed canola oil",
      "organic canola oil",
    ],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Hexane-extracted, high in oxidation-prone omega-6. Cheap filler fat.",
  },
  {
    canonicalName: "soybean oil",
    alternateNames: [
      "soybean oil",
      "soy oil",
      "partially hydrogenated soybean oil",
      "hydrogenated soybean oil",
      "interesterified soybean oil",
    ],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "The most-consumed oil in the US food supply. Industrially refined, omega-6 heavy.",
  },
  {
    canonicalName: "corn oil",
    alternateNames: ["corn oil", "refined corn oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Solvent-extracted from a commodity crop. Highly refined, highly inflammatory ratio.",
  },
  {
    canonicalName: "sunflower oil",
    alternateNames: ["sunflower oil", "high oleic sunflower oil", "sunflower seed oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Industrially refined seed oil. High-oleic versions are better, still not whole food.",
  },
  {
    canonicalName: "safflower oil",
    alternateNames: ["safflower oil", "high oleic safflower oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Refined seed oil, among the highest linoleic acid content of any fat.",
  },
  {
    canonicalName: "cottonseed oil",
    alternateNames: ["cottonseed oil", "hydrogenated cottonseed oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Pressed from a crop grown as textile fiber, not food. Heavily pesticide-treated.",
  },
  {
    canonicalName: "rice bran oil",
    alternateNames: ["rice bran oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Industrially extracted milling byproduct sold as a cooking oil.",
  },
  {
    canonicalName: "grapeseed oil",
    alternateNames: ["grapeseed oil", "grape seed oil"],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Wine-industry byproduct, solvent-extracted, extremely high in omega-6.",
  },
  {
    canonicalName: "vegetable oil",
    alternateNames: [
      "vegetable oil",
      "vegetable oil blend",
      "partially hydrogenated vegetable oil",
      "hydrogenated vegetable oil",
    ],
    category: "seed-oil",
    flagLevel: "red",
    deductionPoints: 6,
    reason: "Unspecified seed oil blend — the manufacturer swaps whatever is cheapest that week.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // SUGARS & SUGAR ALIASES
  // Individually small, collectively the point. Rule 2 punishes the practice of
  // splitting sugar across several names so none reaches the top of the list.
  // Honey and maple syrup are real foods and are deliberately NOT in this
  // category — they're filed under minimally-processed with a 0 deduction so
  // they never trigger the hidden-sugar penalty.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "high fructose corn syrup",
    alternateNames: [
      "high fructose corn syrup",
      "hfcs",
      "high-fructose corn syrup",
      "hfcs 55",
      "isoglucose",
      "glucose-fructose syrup",
    ],
    category: "sugar-alias",
    flagLevel: "red",
    deductionPoints: 10,
    reason: "The cheapest sweetener in the industrial pantry. Liver-metabolized, appetite-dysregulating.",
  },
  {
    canonicalName: "corn syrup",
    alternateNames: ["corn syrup", "glucose syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 6,
    reason: "Refined commodity-corn sweetener with zero nutritional contribution.",
  },
  {
    canonicalName: "corn syrup solids",
    alternateNames: ["corn syrup solids", "dried glucose syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 5,
    reason: "Dehydrated corn syrup — the same sugar, renamed to sit lower on the label.",
  },
  {
    canonicalName: "maltodextrin",
    alternateNames: ["maltodextrin", "modified maltodextrin"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Spikes blood glucose harder than table sugar, yet legally isn't 'sugar'.",
  },
  {
    canonicalName: "dextrose",
    alternateNames: ["dextrose", "dextrose monohydrate", "corn sugar"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Pure glucose under a name most shoppers won't recognize as sugar.",
  },
  {
    canonicalName: "maltose",
    alternateNames: ["maltose", "malt syrup", "barley malt syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "A sugar wearing a grain's name.",
  },
  {
    canonicalName: "fructose",
    alternateNames: ["fructose", "crystalline fructose", "fruit sugar"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Isolated fructose without the fiber that makes fruit fruit.",
  },
  {
    canonicalName: "invert sugar",
    alternateNames: ["invert sugar", "inverted sugar syrup", "invert syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Sucrose split into glucose and fructose to be sweeter per gram.",
  },
  {
    canonicalName: "brown rice syrup",
    alternateNames: ["brown rice syrup", "rice syrup", "rice malt syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Health-halo sweetener with a higher glycemic index than table sugar.",
  },
  {
    canonicalName: "agave nectar",
    alternateNames: ["agave nectar", "agave syrup", "agave"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Marketed as natural; more fructose-dense than high fructose corn syrup.",
  },
  {
    canonicalName: "fruit juice concentrate",
    alternateNames: [
      "fruit juice concentrate",
      "apple juice concentrate",
      "grape juice concentrate",
      "pear juice concentrate",
      "white grape juice concentrate",
      "juice concentrate",
    ],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Fruit stripped of everything but its sugar, then used as a sweetener.",
  },
  {
    canonicalName: "sugar",
    alternateNames: [
      "sugar",
      "cane sugar",
      "organic cane sugar",
      "pure cane sugar",
      "evaporated cane juice",
      "cane juice",
      "granulated sugar",
      "beet sugar",
      "brown sugar",
      "raw sugar",
      "turbinado sugar",
      "confectioners sugar",
      "powdered sugar",
    ],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Added sugar. Honest about what it is, which is more than most of this list.",
  },
  {
    canonicalName: "sucrose",
    alternateNames: ["sucrose"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Table sugar, listed under its chemical name.",
  },
  {
    canonicalName: "glucose",
    alternateNames: ["glucose", "glucose solids"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Simple sugar, added rather than inherent.",
  },
  {
    canonicalName: "lactose",
    alternateNames: ["lactose"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Isolated milk sugar used to bulk out powders and seasonings.",
  },
  {
    canonicalName: "molasses",
    alternateNames: ["molasses", "cane molasses", "blackstrap molasses"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Sugar refining byproduct. Trace minerals don't make it not-sugar.",
  },
  {
    canonicalName: "tapioca syrup",
    alternateNames: ["tapioca syrup", "tapioca fiber syrup"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Clean-label sweetener of choice for products that want to hide their sugar line.",
  },
  {
    canonicalName: "date syrup",
    alternateNames: ["date syrup", "date paste", "date sugar"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Closer to whole fruit than most sweeteners, but still a concentrated sugar.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // INDUSTRIAL EMULSIFIERS & THICKENERS
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "carrageenan",
    alternateNames: ["carrageenan", "irish moss extract", "e407"],
    category: "industrial-emulsifier",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Degrades into a known gut irritant; linked to intestinal inflammation.",
  },
  {
    canonicalName: "polysorbate 80",
    alternateNames: ["polysorbate 80", "polyoxyethylene sorbitan monooleate", "e433"],
    category: "industrial-emulsifier",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Detergent-class emulsifier shown to thin the gut mucus layer in animal models.",
  },
  {
    canonicalName: "polysorbate 60",
    alternateNames: ["polysorbate 60", "e435"],
    category: "industrial-emulsifier",
    flagLevel: "red",
    deductionPoints: 5,
    reason: "Synthetic detergent-class emulsifier with the same gut-barrier concerns as PS80.",
  },
  {
    canonicalName: "mono and diglycerides",
    alternateNames: [
      "mono and diglycerides",
      "mono- and diglycerides",
      "monoglycerides",
      "diglycerides",
      "mono & diglycerides",
      "mono and diglycerides of fatty acids",
      "e471",
    ],
    category: "industrial-emulsifier",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "A legal loophole for trans fats — not counted on the nutrition panel.",
  },
  {
    canonicalName: "datem",
    alternateNames: ["datem", "diacetyl tartaric acid esters of mono- and diglycerides", "e472e"],
    category: "industrial-emulsifier",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Industrial dough conditioner. A sign the bread was made by a machine, fast.",
  },
  {
    canonicalName: "sodium stearoyl lactylate",
    alternateNames: ["sodium stearoyl lactylate", "sodium stearoyl-2-lactylate", "ssl", "e481"],
    category: "industrial-emulsifier",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Synthetic dough conditioner used to fake the texture of slow-fermented bread.",
  },
  {
    canonicalName: "soy lecithin",
    alternateNames: ["soy lecithin", "soya lecithin", "lecithin", "e322"],
    category: "industrial-emulsifier",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Hexane-extracted from soybean oil sludge. Mild, but industrial.",
  },
  {
    canonicalName: "cellulose gum",
    alternateNames: ["cellulose gum", "carboxymethyl cellulose", "cmc", "sodium carboxymethylcellulose", "e466"],
    category: "thickener",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Processed wood pulp used to fake creaminess. Emerging microbiome concerns.",
  },
  {
    canonicalName: "sunflower lecithin",
    alternateNames: ["sunflower lecithin"],
    category: "industrial-emulsifier",
    flagLevel: "green",
    deductionPoints: 0,
    reason: "Mechanically extracted, no hexane. The acceptable lecithin.",
  },
  {
    canonicalName: "xanthan gum",
    alternateNames: ["xanthan gum", "e415"],
    category: "thickener",
    flagLevel: "green",
    deductionPoints: 0,
    reason: "Fermented thickener with a clean safety record at food doses.",
  },
  {
    canonicalName: "guar gum",
    alternateNames: ["guar gum", "e412"],
    category: "thickener",
    flagLevel: "green",
    deductionPoints: 0,
    reason: "Ground bean fiber. Functionally boring, which is the point.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // PHOSPHATES — amber, 4
  // Added phosphorus is absorbed far more readily than food-bound phosphorus and
  // is associated with kidney and cardiovascular strain.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "sodium phosphate",
    alternateNames: ["sodium phosphate", "sodium phosphates", "e339"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Added inorganic phosphate — absorbed nearly 100%, unlike phosphorus from food.",
  },
  {
    canonicalName: "disodium phosphate",
    alternateNames: ["disodium phosphate", "dsp"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Emulsifying salt that keeps processed cheese from separating into its parts.",
  },
  {
    canonicalName: "trisodium phosphate",
    alternateNames: ["trisodium phosphate", "tsp", "e339iii"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Also sold as an industrial degreaser. Same molecule, different aisle.",
  },
  {
    canonicalName: "sodium tripolyphosphate",
    alternateNames: ["sodium tripolyphosphate", "sodium triphosphate", "stpp", "e451"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Water-binding phosphate that makes you pay meat prices for brine.",
  },
  {
    canonicalName: "calcium phosphate",
    alternateNames: ["calcium phosphate", "tricalcium phosphate", "dicalcium phosphate", "e341"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Anti-caking phosphate. Adds bulk and free-flow, not nutrition.",
  },
  {
    canonicalName: "sodium acid pyrophosphate",
    alternateNames: ["sodium acid pyrophosphate", "sapp", "disodium pyrophosphate", "e450"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "Leavening phosphate used to keep processed potatoes from turning grey.",
  },
  {
    canonicalName: "phosphoric acid",
    alternateNames: ["phosphoric acid", "e338"],
    category: "phosphate",
    flagLevel: "amber",
    deductionPoints: 4,
    reason: "The sourness in dark soda. Associated with lower bone mineral density.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // FLAVORS
  // "Artificial flavor" is a chemical. "Natural flavor" is also a chemical — it
  // just started life in something that once grew. Both hide their contents
  // behind trade-secret law; artificial is charged more because it isn't even
  // pretending.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "artificial flavor",
    alternateNames: [
      "artificial flavor",
      "artificial flavors",
      "artificial flavoring",
      "artificially flavored",
      "artificial flavour",
      "artificial flavours",
    ],
    category: "artificial-flavor",
    flagLevel: "red",
    deductionPoints: 4,
    reason: "A lab-built flavor compound. Trade-secret law means you'll never know which.",
  },
  {
    canonicalName: "natural flavor",
    alternateNames: [
      "natural flavor",
      "natural flavors",
      "natural flavoring",
      "natural flavour",
      "natural flavours",
      "natural and artificial flavors",
      "natural and artificial flavor",
      "natural & artificial flavors",
      "natural chocolate flavor",
      "natural vanilla flavor",
      "other natural flavors",
    ],
    category: "natural-flavor",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "A catch-all that can legally hide dozens of undisclosed compounds and solvents.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // CARCINOGENIC / ENDOCRINE CONCERNS — red, 8
  // Potassium bromate is also a preservative, but the carcinogen classification
  // is the more serious fact about it, so it is filed and priced here.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "potassium bromate",
    alternateNames: ["potassium bromate", "bromated flour", "e924"],
    category: "carcinogenic-concern",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "IARC-classified possible human carcinogen. Banned nearly everywhere but the US.",
    bannedInCountries: ["EU", "UK", "Canada", "Brazil", "China", "California"],
  },
  {
    canonicalName: "brominated vegetable oil",
    alternateNames: ["brominated vegetable oil", "bvo"],
    category: "carcinogenic-concern",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Bromine accumulates in body fat. The FDA finally revoked it in 2024.",
    bannedInCountries: ["EU", "Japan", "India", "US (revoked 2024)"],
  },
  {
    canonicalName: "propylparaben",
    alternateNames: ["propylparaben", "propyl paraben", "e216"],
    category: "endocrine-disruptor",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Endocrine disruptor that mimics estrogen. Banned from food in the EU.",
    bannedInCountries: ["EU"],
  },
  {
    canonicalName: "butylparaben",
    alternateNames: ["butylparaben", "butyl paraben", "e209"],
    category: "endocrine-disruptor",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "Estrogenic preservative with documented reproductive-system effects.",
    bannedInCountries: ["EU"],
  },
  {
    canonicalName: "azodicarbonamide",
    alternateNames: ["azodicarbonamide", "ada", "e927a"],
    category: "carcinogenic-concern",
    flagLevel: "red",
    deductionPoints: 8,
    reason: "The yoga-mat chemical. A dough conditioner that degrades into a carcinogen when baked.",
    bannedInCountries: ["EU", "UK", "Australia", "Singapore"],
  },

  // ───────────────────────────────────────────────────────────────────────────
  // REFINED FILLERS, BLEACHING AGENTS, FLAVOR ENHANCERS
  // Not in the original spec, but a scoring engine that ignores refined flour
  // and MSG-family additives will score a box of mac & cheese like a steak.
  // ───────────────────────────────────────────────────────────────────────────
  {
    canonicalName: "enriched flour",
    alternateNames: [
      "enriched flour",
      "enriched wheat flour",
      "enriched bleached flour",
      "enriched bleached wheat flour",
      "enriched macaroni",
      "enriched macaroni product",
      "enriched pasta",
      "enriched durum flour",
      "bleached wheat flour",
      "bleached flour",
      "white flour",
      "refined wheat flour",
    ],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Stripped of fiber and germ, then 'enriched' with a fraction of what was removed.",
  },
  {
    canonicalName: "wheat flour",
    alternateNames: ["wheat flour", "durum flour", "semolina", "durum semolina", "wheat semolina"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Refined grain. Fine in context, but it is not a whole food.",
  },
  {
    canonicalName: "modified corn starch",
    alternateNames: [
      "modified corn starch",
      "modified food starch",
      "modified starch",
      "modified tapioca starch",
    ],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Chemically or enzymatically altered starch used as cheap bulk and body.",
  },
  {
    canonicalName: "corn starch",
    alternateNames: [
      "corn starch",
      "cornstarch",
      "tapioca starch",
      "tapioca flour",
      "potato starch",
      "rice flour",
    ],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 1,
    reason: "Isolated starch. Benign in small amounts, but it is filler.",
  },
  {
    canonicalName: "silicon dioxide",
    alternateNames: ["silicon dioxide", "silica", "e551"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 1,
    reason: "Anti-caking agent. Mild, but it is there to keep a powder flowing, not to feed you.",
  },
  {
    canonicalName: "taurine",
    alternateNames: ["taurine"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Synthesized amino acid dosed into energy drinks well above anything you'd eat.",
  },
  {
    canonicalName: "glucuronolactone",
    alternateNames: ["glucuronolactone"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Lab-made energy-drink additive with almost no long-term human safety data.",
  },
  {
    canonicalName: "chocolate",
    alternateNames: ["chocolate", "dark chocolate", "milk chocolate", "chocolate chips"],
    category: "sugar-alias",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Listed with no sub-ingredients. 'Chocolate' on a label is cocoa plus added sugar.",
  },
  {
    canonicalName: "monosodium glutamate",
    alternateNames: ["monosodium glutamate", "msg", "e621"],
    category: "artificial-flavor",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Isolated glutamate engineered to make low-quality food taste worth eating.",
  },
  {
    canonicalName: "yeast extract",
    alternateNames: ["yeast extract", "autolyzed yeast extract", "autolyzed yeast", "hydrolyzed yeast"],
    category: "artificial-flavor",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Free glutamates by another name — MSG that gets to skip the MSG label.",
  },
  {
    canonicalName: "disodium inosinate",
    alternateNames: ["disodium inosinate", "e631"],
    category: "artificial-flavor",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Flavor amplifier used almost exclusively alongside MSG.",
  },
  {
    canonicalName: "disodium guanylate",
    alternateNames: ["disodium guanylate", "e627"],
    category: "artificial-flavor",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Flavor amplifier used almost exclusively alongside MSG.",
  },
  {
    canonicalName: "hydrolyzed protein",
    alternateNames: [
      "hydrolyzed protein",
      "hydrolyzed vegetable protein",
      "hydrolyzed soy protein",
      "hydrolyzed corn protein",
      "textured vegetable protein",
    ],
    category: "artificial-flavor",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Acid-treated protein that yields free glutamates. Another MSG side door.",
  },
  {
    canonicalName: "soy protein isolate",
    alternateNames: ["soy protein isolate", "soy protein concentrate"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Hexane-processed protein fraction. An industrial input, not an ingredient.",
  },
  {
    canonicalName: "milk protein concentrate",
    alternateNames: ["milk protein concentrate", "whey protein concentrate", "whey protein isolate", "caseinate", "sodium caseinate"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Ultra-filtered dairy fraction used to hit a protein claim on the front of the box.",
  },
  {
    canonicalName: "benzoyl peroxide",
    alternateNames: ["benzoyl peroxide"],
    category: "bleaching-agent",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Flour bleaching agent. Also the active ingredient in acne cream.",
  },
  {
    canonicalName: "calcium propionate",
    alternateNames: ["calcium propionate", "e282"],
    category: "preservative",
    flagLevel: "amber",
    deductionPoints: 2,
    reason: "Mold inhibitor associated with behavioral effects in children in small studies.",
  },
  {
    canonicalName: "caffeine",
    alternateNames: ["caffeine", "caffeine anhydrous", "synthetic caffeine"],
    category: "filler",
    flagLevel: "amber",
    deductionPoints: 1,
    reason: "Isolated stimulant. Not dangerous in itself, but it is an additive, not a food.",
  },
  {
    canonicalName: "sucrose acetate isobutyrate",
    alternateNames: ["sucrose acetate isobutyrate", "saib", "e444"],
    category: "industrial-emulsifier",
    flagLevel: "amber",
    deductionPoints: 3,
    reason: "Weighting agent that keeps flavor oils suspended in soda. Pure formulation chemistry.",
  },

  // ───────────────────────────────────────────────────────────────────────────
  // GOOD INGREDIENTS — green, 0
  // Present so the engine can tell "we don't know this" from "we know this and
  // it's fine". Only these count toward greenCount.
  // ───────────────────────────────────────────────────────────────────────────
  ...([
    // Water, salt, acids
    ["water", ["water", "filtered water", "purified water", "carbonated water", "carbonated filtered water", "spring water"], "minimally-processed", "Water."],
    ["salt", ["salt", "sea salt", "celtic sea salt", "himalayan salt", "kosher salt", "redmond real salt"], "minimally-processed", "Salt. Food has been salted for ten thousand years."],
    ["citric acid", ["citric acid"], "minimally-processed", "Common food acid, generally benign at food levels."],
    ["lactic acid", ["lactic acid"], "minimally-processed", "Fermentation acid. Ordinary in cheese and cultured foods."],
    ["malic acid", ["malic acid"], "minimally-processed", "The acid in apples. Benign at food levels."],
    ["acetic acid", ["acetic acid"], "minimally-processed", "The acid in vinegar."],
    ["vinegar", ["vinegar", "white vinegar", "distilled vinegar"], "minimally-processed", "Fermented, traditional, fine."],
    ["apple cider vinegar", ["apple cider vinegar"], "minimally-processed", "Fermented, traditional, fine."],
    ["lemon juice", ["lemon juice", "lemon juice concentrate"], "whole-food", "Fruit acid from actual fruit."],
    ["lime juice", ["lime juice"], "whole-food", "Fruit acid from actual fruit."],

    // Traditional fats
    ["olive oil", ["olive oil", "extra virgin olive oil", "evoo", "cold pressed olive oil", "cold-pressed extra virgin olive oil", "organic extra virgin olive oil"], "whole-food", "Cold-pressed fruit oil. Thousands of years of use, and the data agrees."],
    ["coconut oil", ["coconut oil", "virgin coconut oil", "unrefined coconut oil"], "whole-food", "Stable saturated fat, minimally processed."],
    ["avocado oil", ["avocado oil", "extra virgin avocado oil"], "whole-food", "Cold-pressed fruit oil with a high smoke point."],
    ["butter", ["butter", "grass-fed butter", "grass fed butter", "sweet cream butter", "unsalted butter", "cultured butter"], "whole-food", "Butter. Real food."],
    ["ghee", ["ghee", "clarified butter"], "whole-food", "Clarified butter. Traditional and shelf-stable without additives."],
    ["tallow", ["tallow", "beef tallow", "suet"], "whole-food", "Rendered ruminant fat. What fries were cooked in before seed oils."],
    ["lard", ["lard", "pork fat"], "whole-food", "Rendered pork fat, traditionally used and stable under heat."],

    // Dairy & eggs
    ["whole milk", ["whole milk", "milk", "pasteurized milk", "cultured pasteurized milk", "part-skim cow's milk"], "minimally-processed", "Milk."],
    ["nonfat milk", ["nonfat milk", "skim milk", "fat free milk"], "minimally-processed", "Milk with the fat removed."],
    ["buttermilk", ["buttermilk"], "minimally-processed", "Cultured milk."],
    ["heavy cream", ["heavy cream", "cream", "heavy whipping cream"], "whole-food", "Cream."],
    ["eggs", ["eggs", "egg", "whole eggs", "cage free eggs", "pasture raised eggs"], "whole-food", "Eggs."],
    ["egg whites", ["egg whites", "egg white"], "whole-food", "Eggs."],
    ["cheddar cheese", ["cheddar cheese", "cheese", "blue cheese", "mozzarella"], "minimally-processed", "Real cheese, made by fermenting milk."],
    ["romano cheese", ["romano cheese", "parmesan cheese", "pecorino romano"], "minimally-processed", "Real cheese, made by fermenting milk."],
    ["whey", ["whey"], "minimally-processed", "Ordinary dairy fraction, left over from cheesemaking."],
    ["milkfat", ["milkfat", "butterfat"], "minimally-processed", "The fat in milk."],
    ["cheese cultures", ["cheese cultures", "cheese culture", "cultures", "live cultures"], "minimally-processed", "The bacteria that turn milk into cheese."],
    ["enzymes", ["enzymes", "non-animal enzymes", "rennet", "microbial rennet"], "minimally-processed", "What curdles milk into cheese. As old as cheese."],
    ["yogurt", ["yogurt", "greek yogurt", "plain yogurt"], "minimally-processed", "Fermented milk."],

    // Meat & fish
    ["beef", ["beef", "ground beef", "grass-fed beef", "grass fed beef", "grass-fed ground beef", "organic grass-fed ground beef", "100% grass-fed beef", "steak"], "whole-food", "Meat."],
    ["chicken", ["chicken", "chicken breast", "chicken thigh", "pasture raised chicken"], "whole-food", "Meat."],
    ["turkey", ["turkey", "ground turkey"], "whole-food", "Meat."],
    ["pork", ["pork", "pork loin"], "whole-food", "Meat."],
    ["bison", ["bison", "ground bison"], "whole-food", "Meat."],
    ["lamb", ["lamb", "ground lamb"], "whole-food", "Meat."],
    ["salmon", ["salmon", "wild caught salmon", "wild-caught salmon"], "whole-food", "Fish."],
    ["sardines", ["sardines"], "whole-food", "Small oily fish. Nutritionally excellent."],
    ["anchovies", ["anchovies", "anchovy"], "whole-food", "Small oily fish. Nutritionally excellent."],
    ["mackerel", ["mackerel"], "whole-food", "Small oily fish. Nutritionally excellent."],
    ["tuna", ["tuna", "albacore tuna"], "whole-food", "Fish."],
    ["shrimp", ["shrimp", "prawns"], "whole-food", "Shellfish."],
    ["bone broth", ["bone broth", "beef broth", "beef stock"], "minimally-processed", "Simmered stock."],
    ["chicken broth", ["chicken broth", "chicken stock"], "minimally-processed", "Simmered stock."],
    ["vegetable broth", ["vegetable broth", "vegetable stock"], "minimally-processed", "Simmered stock."],

    // Produce
    ["tomatoes", ["tomatoes", "tomato", "tomato puree", "tomato paste", "crushed tomatoes", "tomato powder"], "whole-food", "Tomatoes."],
    ["garlic", ["garlic", "garlic powder", "fresh garlic"], "whole-food", "Garlic."],
    ["onion", ["onion", "onions", "onion powder"], "whole-food", "Onion."],
    ["spinach", ["spinach"], "whole-food", "Leafy greens."],
    ["kale", ["kale"], "whole-food", "Leafy greens."],
    ["lettuce", ["lettuce", "romaine", "arugula"], "whole-food", "Leafy greens."],
    ["broccoli", ["broccoli"], "whole-food", "Cruciferous vegetable."],
    ["cauliflower", ["cauliflower"], "whole-food", "Cruciferous vegetable."],
    ["cabbage", ["cabbage", "brussels sprouts"], "whole-food", "Cruciferous vegetable."],
    ["carrots", ["carrots", "carrot"], "whole-food", "Vegetable."],
    ["celery", ["celery"], "whole-food", "Vegetable."],
    ["cucumber", ["cucumber", "zucchini"], "whole-food", "Vegetable."],
    ["bell pepper", ["bell pepper", "red bell pepper", "green bell pepper", "bell pepper powder", "red and green bell pepper powder"], "whole-food", "Vegetable."],
    ["mushrooms", ["mushrooms", "mushroom", "shiitake", "portobello"], "whole-food", "Mushrooms."],
    ["sweet potato", ["sweet potato", "sweet potatoes", "yam"], "whole-food", "Whole root vegetable."],
    ["potatoes", ["potatoes", "potato"], "whole-food", "Whole root vegetable."],
    ["avocado", ["avocado", "avocados"], "whole-food", "Whole fruit."],
    ["blueberries", ["blueberries", "berries"], "whole-food", "Whole fruit."],
    ["strawberries", ["strawberries"], "whole-food", "Whole fruit."],
    ["raspberries", ["raspberries", "blackberries"], "whole-food", "Whole fruit."],
    ["apples", ["apples", "apple"], "whole-food", "Whole fruit."],
    ["bananas", ["bananas", "banana"], "whole-food", "Whole fruit."],
    ["oranges", ["oranges", "orange"], "whole-food", "Whole fruit."],
    ["dates", ["dates", "date", "medjool dates", "deglet noor dates"], "whole-food", "Whole fruit — sugar arrives with its fiber attached."],
    ["raisins", ["raisins"], "whole-food", "Dried whole fruit."],
    ["dried cranberries", ["dried cranberries", "dried figs", "prunes"], "whole-food", "Dried whole fruit."],
    ["coconut", ["coconut", "shredded coconut", "coconut flakes", "coconut flour"], "whole-food", "Coconut."],
    ["coconut milk", ["coconut milk"], "whole-food", "Coconut."],
    ["olives", ["olives", "kalamata olives", "green olives"], "whole-food", "Whole fruit."],

    // Nuts, seeds, grains, legumes
    ["almonds", ["almonds", "almond", "almond butter", "almond flour"], "whole-food", "Whole nut."],
    ["walnuts", ["walnuts"], "whole-food", "Whole nut."],
    ["pecans", ["pecans"], "whole-food", "Whole nut."],
    ["hazelnuts", ["hazelnuts", "macadamia nuts", "brazil nuts", "pistachios"], "whole-food", "Whole nut."],
    ["cashews", ["cashews", "cashew", "cashew butter"], "whole-food", "Whole nut."],
    ["peanuts", ["peanuts", "peanut butter", "peanut"], "whole-food", "Legume, but whole and unprocessed."],
    ["pumpkin seeds", ["pumpkin seeds", "pepitas"], "whole-food", "Whole seed."],
    ["sesame seeds", ["sesame seeds", "tahini"], "whole-food", "Whole seed."],
    ["chia seeds", ["chia seeds", "chia"], "whole-food", "Whole seed."],
    ["flax seeds", ["flax seeds", "flaxseed", "ground flaxseed"], "whole-food", "Whole seed."],
    ["hemp seeds", ["hemp seeds", "hemp hearts"], "whole-food", "Whole seed."],
    ["oats", ["oats", "rolled oats", "whole grain oats", "steel cut oats", "oat flour"], "whole-food", "Whole grain."],
    ["quinoa", ["quinoa"], "whole-food", "Whole grain."],
    ["brown rice", ["brown rice", "wild rice"], "whole-food", "Whole grain."],
    ["corn", ["corn", "whole corn", "whole grain corn", "corn flour", "corn masa flour", "masa"], "whole-food", "Whole grain corn."],
    ["whole wheat flour", ["whole wheat flour", "whole grain wheat flour", "sprouted wheat flour"], "minimally-processed", "Whole grain flour — bran and germ intact."],
    ["black beans", ["black beans", "kidney beans", "pinto beans"], "whole-food", "Whole legume."],
    ["chickpeas", ["chickpeas", "garbanzo beans"], "whole-food", "Whole legume."],
    ["lentils", ["lentils"], "whole-food", "Whole legume."],

    // Spices, herbs, flavor
    ["black pepper", ["black pepper", "pepper", "peppercorns"], "whole-food", "Spice."],
    ["turmeric", ["turmeric", "turmeric extract", "oleoresin turmeric", "turmeric oleoresin"], "whole-food", "Spice — and the honest way to color food yellow."],
    ["cinnamon", ["cinnamon", "ceylon cinnamon"], "whole-food", "Spice."],
    ["ginger", ["ginger", "ginger root extract", "ginger root"], "whole-food", "Spice."],
    ["spices", ["spices", "herbs"], "whole-food", "Actual spices."],
    ["oregano", ["oregano", "basil", "thyme", "parsley", "sage"], "whole-food", "Herb."],
    ["cumin", ["cumin", "coriander", "cardamom"], "whole-food", "Spice."],
    ["paprika", ["paprika", "chili powder", "cayenne", "chipotle powder"], "whole-food", "Spice."],
    ["rosemary extract", ["rosemary extract", "rosemary", "rosemary oil"], "minimally-processed", "Natural antioxidant — the clean answer to BHT."],
    ["vanilla extract", ["vanilla extract", "vanilla", "vanilla bean", "ground vanilla bean"], "minimally-processed", "Real vanilla, extracted from the bean."],
    ["cocoa", ["cocoa", "cacao", "cocoa powder", "cacao nibs", "unsweetened chocolate", "chocolate liquor"], "whole-food", "Cocoa. The sugar it usually travels with is scored separately."],
    ["annatto", ["annatto", "annatto extract"], "minimally-processed", "Plant-derived color. The right way to color food."],
    ["paprika extract", ["paprika extract", "paprika oleoresin", "oleoresin paprika"], "minimally-processed", "Plant-derived color. The right way to color food."],
    ["beet juice", ["beet juice", "beet juice concentrate", "beets"], "minimally-processed", "Plant-derived color. The right way to color food."],
    ["beta carotene", ["beta carotene"], "minimally-processed", "Plant-derived color. The right way to color food."],
    ["green tea extract", ["green tea extract", "green tea leaf extract", "green tea"], "minimally-processed", "Plant extract."],
    ["guarana", ["guarana", "guarana seed extract", "guarana extract"], "minimally-processed", "Plant extract (a caffeine source — caffeine itself is scored separately)."],
    ["honey", ["honey", "raw honey", "manuka honey"], "minimally-processed", "Real food. Sweet, but not an engineered sweetener — never counts as a sugar alias."],
    ["maple syrup", ["maple syrup", "pure maple syrup", "grade a maple syrup"], "minimally-processed", "Real food. Boiled tree sap, nothing added."],
    ["baking soda", ["baking soda", "sodium bicarbonate", "baking powder", "cream of tartar"], "minimally-processed", "Standard leavening."],
    ["yeast", ["yeast", "active dry yeast", "sourdough starter", "cultured wheat flour"], "minimally-processed", "Leavening by fermentation."],

    // Vitamins & fortification — neutral. Not food, but not a reason to punish.
    ["vitamins", [
      "niacin", "niacinamide", "ferrous sulfate", "thiamin mononitrate", "thiamine mononitrate",
      "riboflavin", "folic acid", "ascorbic acid", "vitamin c", "vitamin d3", "vitamin a palmitate",
      "vitamin e", "tocopherols", "mixed tocopherols", "calcium pantothenate", "pyridoxine hcl",
      "pyridoxine hydrochloride", "cyanocobalamin", "biotin", "vitamin b6", "vitamin b12",
      "chromium", "chromium chelate", "zinc", "calcium carbonate", "potassium citrate",
    ], "minimally-processed", "Added vitamin or mineral. Fortification, not a red flag."],
  ] as const).map(([canonicalName, alternateNames, category, reason]) => ({
    canonicalName,
    alternateNames: [...alternateNames],
    category: category as IngredientEntry["category"],
    flagLevel: "green" as const,
    deductionPoints: 0,
    reason,
  })),
];

/**
 * Exact-match index: every canonical name and alias → its entry.
 *
 * Built once at module load. If two entries claim the same alias, the first one
 * in INGREDIENT_DB wins — so ordering in the array above is the tiebreaker, and
 * lookups are stable across runs.
 */
const EXACT_INDEX: Map<string, IngredientEntry> = (() => {
  const index = new Map<string, IngredientEntry>();
  for (const entry of INGREDIENT_DB) {
    for (const name of [entry.canonicalName, ...entry.alternateNames]) {
      if (!index.has(name)) index.set(name, entry);
    }
  }
  return index;
})();

/**
 * Every alias paired with its entry, sorted longest-first.
 *
 * Longest-first is what makes containment matching safe: "high fructose corn
 * syrup" must be tested before "corn syrup", and "brominated vegetable oil"
 * before "vegetable oil", or the label would score as the milder ingredient.
 * Ties break on alias text so the order is fully determined.
 */
const CONTAINMENT_INDEX: Array<{ alias: string; pattern: RegExp; entry: IngredientEntry }> = (() => {
  const pairs: Array<{ alias: string; entry: IngredientEntry }> = [];
  for (const entry of INGREDIENT_DB) {
    for (const alias of [entry.canonicalName, ...entry.alternateNames]) {
      pairs.push({ alias, entry });
    }
  }
  pairs.sort((a, b) => b.alias.length - a.alias.length || a.alias.localeCompare(b.alias));
  return pairs.map(({ alias, entry }) => ({
    alias,
    // Word-boundary-ish match so "salt" doesn't fire inside "asphalt" and "corn"
    // doesn't fire inside "popcorn". \b is unreliable next to "&" and "#", so we
    // assert on non-word characters explicitly.
    pattern: new RegExp(`(^|[^a-z0-9])${escapeRegExp(alias)}($|[^a-z0-9])`, "i"),
    entry,
  }));
})();

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * How much of the phrase an alias must account for to match by containment.
 * "canola oil" is 10 of the 22 characters in "expeller pressed canola oil", and
 * that is enough. "cheese" is 6 of the 16 in "cheese sauce mix", and that is not.
 */
const MIN_CONTAINMENT_RATIO = 0.6;

/**
 * Look up a normalized ingredient name.
 *
 * Two passes, in order:
 *  1. Exact match on a canonical name or alias.
 *  2. Longest-alias-first containment, so "fd&c red no. 40 lake" still resolves
 *     to Red 40 and "expeller pressed canola oil" to canola oil.
 *
 * Containment is the dangerous pass, because an alias appearing *somewhere* in a
 * phrase does not make the phrase that ingredient: "cheese sauce mix" contains
 * the word "cheese" but is a powdered formulation, not cheese, and matching it
 * as real cheese would let a product launder its additives through a green
 * parent. So containment only fires when the alias is the head of the phrase —
 * English puts the head noun last, which is why "organic canola oil" IS canola
 * oil while "cheese sauce mix" is not cheese — or when the alias accounts for
 * most of the phrase anyway.
 *
 * Returns undefined when nothing matches. The caller decides what an unknown
 * ingredient is worth (the engine treats it as neutral).
 */
export function findIngredient(normalizedName: string): IngredientEntry | undefined {
  const exact = EXACT_INDEX.get(normalizedName);
  if (exact) return exact;

  for (const { alias, pattern, entry } of CONTAINMENT_INDEX) {
    if (!pattern.test(normalizedName)) continue;

    const isHead = normalizedName.endsWith(alias);
    const isMostOfPhrase = alias.length / normalizedName.length >= MIN_CONTAINMENT_RATIO;
    if (isHead || isMostOfPhrase) return entry;
  }
  return undefined;
}

/** Total rows in the database. Useful for the methodology page. */
export const INGREDIENT_DB_SIZE = INGREDIENT_DB.length;
