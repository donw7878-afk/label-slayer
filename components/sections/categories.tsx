import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";
import { CATEGORIES } from "@/lib/constants";

export function Categories() {
  return (
    <section className="py-28">
      <Container>
        <SectionHead
          eyebrow="What we do"
          heading={
            <>
              We read the fine print
              <br />
              <span className="text-brass">so you don&apos;t get played</span>
            </>
          }
          description={
            <>
              Every product hides its real story in the ingredient deck. We decode
              it, score it, and give you a verdict in plain language —{" "}
              <span className="editorial text-brass-bright">
                then show you something better.
              </span>
            </>
          }
        />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {CATEGORIES.map((category, i) => (
            <Reveal key={category.id} delay={i * 0.08}>
              <div className="group relative h-full overflow-hidden border border-hairline bg-charcoal p-9 transition-all duration-300 hover:-translate-y-1 hover:border-brass/40">
                <div className="mb-5 text-xs tracking-[0.2em] text-brand-muted">
                  {category.number}
                </div>
                <h3 className="mb-3 text-[22px] font-bold tracking-[0.02em] uppercase">
                  {category.name}
                </h3>
                <p className="text-sm leading-relaxed text-ivory-dim">
                  {category.description}
                </p>
                {category.comingSoon && (
                  <span className="mt-4 inline-block border border-brass/35 px-2.5 py-1 text-[10px] tracking-[0.2em] text-brass uppercase">
                    Coming soon
                  </span>
                )}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-brass transition-all duration-350 group-hover:w-full" />
              </div>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
