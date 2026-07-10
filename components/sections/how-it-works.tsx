import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";

const STEPS = [
  {
    roman: "i",
    word: "Scan",
    accent: false,
    description:
      "Scan a barcode in the app or search any product on the site. Food, beauty, personal care — millions of products, one database.",
  },
  {
    roman: "ii",
    word: "Slay",
    accent: true,
    description:
      "Get the score, the verdict, and the red flags in plain language. What the marketing says versus what the label proves.",
  },
  {
    roman: "iii",
    word: "Swap",
    accent: false,
    description:
      "See cleaner alternatives that actually earned their score. Better choices, zero guesswork, no sponsored placements.",
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="py-28">
      <Container>
        <SectionHead
          eyebrow="How it works"
          heading={
            <>
              Scan it. Slay it. <span className="text-brass">Swap it.</span>
            </>
          }
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {STEPS.map((step, i) => (
            <Reveal key={step.word} delay={i * 0.08}>
              <div className="relative h-full border border-hairline bg-linear-to-b from-charcoal-2 to-charcoal p-10">
                <span className="editorial absolute top-6 right-7 text-[52px] leading-none text-brass/20">
                  {step.roman}
                </span>
                <div className="mb-4 text-[34px] font-extrabold tracking-[-0.01em] uppercase">
                  <span className={step.accent ? "text-ember" : undefined}>
                    {step.word}
                  </span>
                </div>
                <p className="text-[14.5px] leading-relaxed text-ivory-dim">
                  {step.description}
                </p>
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
