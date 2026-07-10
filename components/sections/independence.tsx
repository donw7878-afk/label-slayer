import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";

const INDEPENDENCE_ITEMS = [
  {
    title: "No brand money touches ratings",
    description:
      "Manufacturers cannot pay to improve, influence, or preview a score.",
  },
  {
    title: "No sponsored rankings",
    description: "Nothing in our database is an ad wearing a badge.",
  },
  {
    title: '"Verified" badges aren’t for sale',
    description: "Trust isn't a product tier. It's the entire business.",
  },
];

export function Independence() {
  return (
    <section id="independence" className="border-y border-hairline bg-charcoal py-28">
      <Container className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">
        <div>
          <Reveal className="mb-10 max-w-[560px]">
            <span className="eyebrow">Independence</span>
            <h2 className="mt-4 text-[clamp(34px,4.5vw,54px)] leading-[1.04] tracking-[-0.015em]">
              The score is earned.
              <br />
              <span className="text-brass">Never bought.</span>
            </h2>
          </Reveal>
          <Reveal delay={0.1} className="flex flex-col">
            {INDEPENDENCE_ITEMS.map((item, i) => (
              <div
                key={item.title}
                className={`flex gap-5 border-b border-hairline py-6 ${i === 0 ? "border-t" : ""}`}
              >
                <span className="shrink-0 text-lg leading-snug font-extrabold text-ember">
                  ✕
                </span>
                <div>
                  <h4 className="mb-1 text-[16px] font-bold normal-case">
                    {item.title}
                  </h4>
                  <p className="text-sm text-ivory-dim">{item.description}</p>
                </div>
              </div>
            ))}
          </Reveal>
        </div>
        <Reveal delay={0.15}>
          <div className="relative border border-brass/30 bg-glass p-11 backdrop-blur-md">
            <div className="pointer-events-none absolute -top-px -left-px h-11 w-11 border-t-2 border-l-2 border-brass" />
            <div className="pointer-events-none absolute -right-px -bottom-px h-11 w-11 border-r-2 border-b-2 border-brass" />
            <p className="editorial mb-5 text-[30px] leading-[1.35] text-ivory">
              &ldquo;If we ever recommend an alternative, it&apos;s because the
              label earned it —{" "}
              <em className="text-brass-bright not-italic">
                not because someone wrote a check.
              </em>
              &rdquo;
            </p>
            <p className="text-sm text-ivory-dim">
              Our published methodology governs every verdict. Affiliate links,
              when used, never influence scores — and we say so on every page they
              appear.
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
