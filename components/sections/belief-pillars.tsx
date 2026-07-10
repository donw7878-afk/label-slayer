import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { BELIEF_PILLARS } from "@/lib/constants";

export function BeliefPillars() {
  return (
    <section className="border-y border-hairline bg-charcoal py-28">
      <Container>
        <Reveal>
          <p className="editorial mb-18 max-w-[900px] text-[clamp(28px,4vw,44px)] leading-[1.3] text-ivory">
            &ldquo;If your great-grandparents wouldn&apos;t recognize it as food,{" "}
            <em className="text-brass-bright not-italic">we&apos;re asking questions.</em>
            &rdquo;
          </p>
        </Reveal>
        <Reveal delay={0.1} className="grid grid-cols-1 gap-0.5 sm:grid-cols-2 md:grid-cols-5">
          {BELIEF_PILLARS.map((pillar) => (
            <div
              key={pillar.title}
              className="border-t-2 border-brass bg-obsidian px-6 py-8"
            >
              <h4 className="mb-2.5 text-[13px] font-bold tracking-[0.1em] uppercase">
                {pillar.title}
              </h4>
              <p className="text-[12.5px] leading-relaxed text-brand-muted">
                {pillar.description}
              </p>
            </div>
          ))}
        </Reveal>
      </Container>
    </section>
  );
}
