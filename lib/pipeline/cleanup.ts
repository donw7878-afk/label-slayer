/**
 * AI product-name cleanup for crowdsourced data.
 *
 * External APIs (Open Food Facts et al.) return names like "Coca cola can
 * cokes LG" — user-typed, size-suffixed, duplicated. cleanProductName() asks
 * Claude for the name as it appears on the actual packaging. The raw name is
 * kept in products.name_raw; manual/admin entries skip cleanup entirely
 * (trust the human input).
 *
 * Fails open: any API error returns the raw name so a cleanup hiccup never
 * sinks the pipeline.
 */

import Anthropic from "@anthropic-ai/sdk";

const CLEANUP_MODEL = "claude-sonnet-4-6";

const CLEANUP_SYSTEM_PROMPT = `You are a product name normalizer. Given a messy product name from a crowdsourced database, return ONLY the correct, properly formatted product name as it appears on the actual packaging. Fix capitalization, remove size info, remove retailer notes, remove duplicates. Examples:
'Coca cola can cokes LG' → 'Coca-Cola Classic'
'doritos NACHO cheese chips 9.75oz' → 'Doritos Nacho Cheese'
'RXBAR chocolate sea salt protein bar 1.83 OZ' → 'RXBAR Chocolate Sea Salt'
Return ONLY the cleaned name, nothing else.`;

export async function cleanProductName(
  rawName: string,
  brand?: string,
): Promise<string> {
  try {
    const client = new Anthropic();
    const response = await client.messages.create({
      model: CLEANUP_MODEL,
      max_tokens: 50,
      system: CLEANUP_SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: brand ? `${rawName} (brand: ${brand})` : rawName,
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      console.warn(`Cleanup: request refused for "${rawName}" — keeping raw name`);
      return rawName;
    }

    const cleaned = response.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()
      .replace(/^["']|["']$/g, "");

    if (!cleaned || response.stop_reason === "max_tokens") {
      console.warn(`Cleanup: unusable response for "${rawName}" — keeping raw name`);
      return rawName;
    }

    console.log(`Cleanup: "${rawName}" → "${cleaned}"`);
    return cleaned;
  } catch (err) {
    console.warn(
      `Cleanup: failed for "${rawName}" — ${(err as Error).message}; keeping raw name`,
    );
    return rawName;
  }
}
