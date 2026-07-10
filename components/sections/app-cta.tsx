"use client";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";

export function AppCta() {
  return (
    <section id="app" className="relative overflow-hidden border-t border-hairline bg-linear-to-br from-charcoal via-charcoal to-obsidian py-28">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 55% 60% at 25% 50%, rgba(224,71,46,0.08), transparent 65%)",
        }}
      />
      <Container className="relative grid grid-cols-1 items-center gap-16 lg:grid-cols-[1fr_0.75fr]">
        <Reveal>
          <span className="eyebrow">The weapon</span>
          <h2 className="mt-4 mb-5 text-[clamp(36px,5vw,60px)] leading-[1.02] tracking-tight">
            The app is
            <br />
            <span className="text-ember">the blade.</span>
          </h2>
          <p className="mb-9 max-w-[480px] text-[17px] leading-relaxed text-ivory-dim">
            Scan any barcode in the store and get the verdict before it hits your
            cart. The website builds the case. The app delivers the slay. Join
            early access and be first in line.
          </p>
          <form
            className="flex max-w-[480px] border border-ivory/22 bg-obsidian/60"
            onSubmit={(e) => e.preventDefault()}
          >
            <input
              type="email"
              placeholder="Enter your email"
              className="flex-1 bg-transparent px-5.5 py-4.5 text-[15px] text-ivory placeholder:text-brand-muted focus:outline-none"
            />
            <button
              type="submit"
              className="bg-ember px-7.5 text-xs font-bold tracking-[0.1em] text-ivory uppercase transition-colors hover:bg-[#c93a23]"
            >
              Join Early Access
            </button>
          </form>
          <p className="mt-3.5 text-xs text-brand-muted">
            No spam. No selling your data. That would be a label crime.
          </p>
        </Reveal>
        <Reveal delay={0.15}>
          <div className="mx-auto flex aspect-9/16 w-full max-w-[290px] flex-col items-center justify-center gap-3.5 rounded-[36px] border border-dashed border-brass/35 bg-charcoal">
            <span className="border border-brass/40 px-3.5 py-1.5 text-[10px] tracking-[0.25em] text-brass uppercase">
              App preview
            </span>
            <p className="max-w-[220px] text-center text-xs leading-relaxed text-brand-muted">
              Phone mockup with scan screen + character integration
            </p>
          </div>
        </Reveal>
      </Container>
    </section>
  );
}
