"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { HeroLogoMedia } from "./hero-logo-media";

const PROOF_STATS = [
  { num: "100", suffix: "%", label: "Independent" },
  { num: "0", suffix: "", label: "Paid scores. Ever." },
  { num: "1", suffix: "", label: "Standard: the truth" },
];

export function Hero() {
  return (
    <header className="relative overflow-hidden pt-[104px] pb-14">
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 75% 40%, rgba(194,161,94,0.07), transparent 60%)",
        }}
      />
      <Container className="relative grid grid-cols-1 items-center gap-14 lg:grid-cols-[1.15fr_0.85fr]">
        <div>
          <span className="eyebrow">Independent product intelligence</span>
          <h1 className="mt-6 mb-7 text-[clamp(48px,7vw,92px)] leading-[0.98] tracking-[-0.02em]">
            We Slay Labels.
            <br />
            <span className="text-brass">
              Not{" "}
              <span className="relative inline-block">
                Hype.
                <motion.span
                  className="absolute -left-[3%] top-[54%] h-[5px] -rotate-[3.5deg] bg-ember"
                  initial={{ width: 0 }}
                  animate={{ width: "106%" }}
                  transition={{ duration: 0.55, delay: 1.1, ease: [0.7, 0, 0.3, 1] }}
                />
              </span>
            </span>
          </h1>
          <p className="mb-10 max-w-[520px] text-[19px] leading-relaxed text-ivory-dim">
            The front label sells a dressed up lie. The back label tells the naked
            truth. We tell you the naked truth about what&apos;s really inside your
            food, beauty, and household products —{" "}
            <strong className="font-semibold text-ivory">
              no brand bribes, no paid scores, no mercy for anyone.
            </strong>
          </p>
          <div className="flex flex-wrap gap-4">
            <Button
              render={<Link href="/early-access" />}
              nativeButton={false}
              className="h-auto rounded-none bg-ember px-8 py-4 text-[13px] font-bold tracking-[0.12em] text-ivory uppercase hover:bg-[#c93a23]"
            >
              Join Early Access
            </Button>
            <Button
              render={<Link href="/products" />}
              nativeButton={false}
              variant="outline"
              className="h-auto rounded-none border-ivory/25 bg-transparent px-8 py-4 text-[13px] font-bold tracking-[0.12em] text-ivory uppercase hover:border-brass hover:bg-transparent hover:text-brass-bright"
            >
              Search the Slays
            </Button>
          </div>
          <div className="mt-14 flex flex-wrap gap-11">
            {PROOF_STATS.map((stat) => (
              <div key={stat.label}>
                <div className="text-2xl font-extrabold text-ivory">
                  {stat.num}
                  <em className="text-brass not-italic">{stat.suffix}</em>
                </div>
                <div className="mt-0.5 text-[11px] tracking-[0.16em] text-brand-muted uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative flex max-h-[640px] items-center justify-center">
          <div
            className="pointer-events-none absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 60% 55% at 50% 45%, rgba(224,71,46,0.16), transparent 70%)",
            }}
          />
          <HeroLogoMedia />
        </div>
      </Container>
    </header>
  );
}
