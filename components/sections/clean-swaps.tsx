import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";
import { SwapCard } from "@/components/product";
import { SAMPLE_SWAP } from "@/lib/constants";

export function CleanSwaps() {
  return (
    <section className="py-28">
      <Container>
        <SectionHead
          eyebrow="Clean swaps"
          heading={
            <>
              Bad label in.
              <br />
              <span className="text-brass">Better choice out.</span>
            </>
          }
          description="Every slay comes with a path forward. We don't just tell you what's wrong — we show you what earned a better score."
        />
        <Reveal className="grid max-w-[900px] grid-cols-1 items-center gap-6 md:grid-cols-[1fr_80px_1fr]">
          <SwapCard variant="bad" {...SAMPLE_SWAP.bad} />
          <div className="flex items-center justify-center text-3xl text-brass max-md:rotate-90">
            →
          </div>
          <SwapCard variant="good" {...SAMPLE_SWAP.good} />
        </Reveal>
      </Container>
    </section>
  );
}
