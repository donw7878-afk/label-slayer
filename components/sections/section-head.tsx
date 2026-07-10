import { Reveal } from "@/components/reveal";
import { cn } from "@/lib/utils";

interface SectionHeadProps {
  eyebrow: string;
  heading: React.ReactNode;
  description?: React.ReactNode;
  className?: string;
}

export function SectionHead({ eyebrow, heading, description, className }: SectionHeadProps) {
  return (
    <Reveal className={cn("mb-16 max-w-[760px]", className)}>
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-4 mb-5 text-[clamp(34px,4.5vw,54px)] leading-[1.04] tracking-[-0.015em]">
        {heading}
      </h2>
      {description && (
        <p className="text-[17px] leading-relaxed text-ivory-dim">{description}</p>
      )}
    </Reveal>
  );
}
