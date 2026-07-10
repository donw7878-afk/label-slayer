import Image from "next/image";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";
import { VERDICT_TIERS } from "@/lib/constants";

export function VerdictScale() {
  return (
    <section className="py-28">
      <Container>
        <SectionHead
          eyebrow="The verdict system"
          heading={
            <>
              Every product gets
              <br />
              <span className="text-brass">a straight answer</span>
            </>
          }
          description={
            <>
              No vague wellness scores. No 47-factor mystery algorithms. A number,
              a verdict, and the reasons why —{" "}
              <span className="editorial text-brass-bright">
                in language a human actually uses.
              </span>
            </>
          }
        />
        <Reveal className="mb-10 max-w-[1000px] overflow-hidden border border-hairline">
          <Image
            src="/assets/Scoring-System-Chart.png"
            alt="The Label Slayer Scoring System — we don't guess, we analyze, we slay. 90–100 Slayer Approved: clean deck, minimal processing, marketing matches the label. 75–89 Clean Enough: solid choice with minor compromises worth knowing about. 50–74 Mid Shelf: not a disaster, not a win, better options exist. 30–49 Sketchy: multiple red flags, the front label is doing heavy lifting. 10–29 Toxic Trash: engineered food-like product, the deck reads like a chemistry set. 0–9 Label Crime: the marketing and the label live in different realities, slayed on sight. 100% independent, no pay to play here."
            width={1536}
            height={1024}
            className="h-auto w-full object-contain"
          />
        </Reveal>
        <Reveal delay={0.1} className="flex max-w-[1000px] flex-wrap gap-2">
          {VERDICT_TIERS.map((tier) => (
            <div
              key={tier.tier}
              className="flex items-center gap-2.5 border-l-2 bg-charcoal py-2.5 pr-4 pl-3.5"
              style={{ borderColor: tier.color }}
            >
              <span className="text-xs font-extrabold tracking-[0.05em]" style={{ color: tier.color }}>
                {tier.scoreMin}–{tier.scoreMax}
              </span>
              <span
                className="text-[12px] font-bold tracking-[0.08em] uppercase"
                style={{ color: tier.color }}
              >
                {tier.label}
              </span>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
