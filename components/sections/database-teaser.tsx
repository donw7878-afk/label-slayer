"use client";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";
import { SlayCard } from "@/components/product";
import { SEARCH_CHIPS, SAMPLE_PRODUCTS } from "@/lib/constants";

export function DatabaseTeaser() {
  return (
    <section
      id="database"
      className="border-y border-hairline bg-charcoal py-28"
    >
      <Container>
        <SectionHead
          eyebrow="The database"
          heading="Search the slays"
          description="Every product gets the same treatment: ingredient analysis, processing level, red flags, and a verdict you can actually understand."
        />
        <Reveal className="mb-5">
          <form
            className="flex max-w-[720px] border border-ivory/20 bg-obsidian"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="text"
              placeholder="Search any product — Oreos, Red 40, protein bars, face wash…"
              className="flex-1 bg-transparent px-6 py-5 text-base text-ivory placeholder:text-brand-muted focus:outline-none"
            />
            <button
              type="submit"
              className="bg-ivory px-8 text-xs font-bold tracking-[0.12em] text-obsidian uppercase transition-colors hover:bg-brass-bright"
            >
              Search
            </button>
          </form>
        </Reveal>
        <Reveal delay={0.05} className="mb-14 flex flex-wrap gap-2.5">
          {SEARCH_CHIPS.map((chip) => (
            <button
              key={chip}
              className="border border-hairline px-4 py-2 text-xs tracking-[0.04em] text-ivory-dim transition-colors hover:border-brass hover:text-brass-bright"
            >
              {chip}
            </button>
          ))}
        </Reveal>
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SAMPLE_PRODUCTS.map((product, i) => (
            <Reveal key={product.slug} delay={i * 0.08}>
              <SlayCard
                name={product.name}
                score={product.score}
                verdict={product.verdict}
                summary={product.summary}
              />
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
