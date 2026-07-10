import { Container } from "./container";

export function PagePlaceholder({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <section className="py-40">
      <Container className="max-w-[760px]">
        <span className="eyebrow">{eyebrow}</span>
        <h1 className="mt-4 mb-5 text-[clamp(34px,4.5vw,54px)] leading-[1.04] tracking-[-0.015em]">
          {title}
        </h1>
        <p className="text-[17px] leading-relaxed text-ivory-dim">{description}</p>
      </Container>
    </section>
  );
}
