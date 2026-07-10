import Link from "next/link";
import { Logo } from "./logo";

const EXPLORE_LINKS = [
  { href: "/products", label: "Product database" },
  { href: "/ingredients", label: "Ingredient library" },
  { href: "/products", label: "Clean swaps" },
  { href: "/blog", label: "Blog" },
];

const TRUST_LINKS = [
  { href: "/methodology", label: "Methodology" },
  { href: "/independence", label: "Independence" },
  { href: "/about", label: "About" },
  { href: "/about", label: "Contact" },
];

const LEGAL_LINKS = [
  { href: "/privacy", label: "Privacy policy" },
  { href: "/terms", label: "Terms of use" },
  { href: "/disclaimers", label: "Disclaimers" },
];

export function Footer() {
  return (
    <footer className="border-t border-hairline bg-obsidian px-6 pt-16 pb-10 md:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-14 grid grid-cols-2 gap-10 md:grid-cols-[1.4fr_1fr_1fr_1fr] md:gap-12">
          <div className="col-span-2 md:col-span-1">
            <Logo />
            <p className="mt-4 max-w-[280px] text-[13px] leading-relaxed text-brand-muted">
              Independent product intelligence. We decode what&apos;s really in your
              food, beauty, and household products — and we don&apos;t take brand
              money to do it.
            </p>
          </div>
          <FooterColumn heading="Explore" links={EXPLORE_LINKS} />
          <FooterColumn heading="Trust" links={TRUST_LINKS} />
          <FooterColumn heading="Legal" links={LEGAL_LINKS} />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4 border-t border-hairline pt-8">
          <p className="text-xs text-brand-muted">
            © {new Date().getFullYear()} The Label Slayer. All rights reserved.
          </p>
          <p className="text-xs text-brand-muted">We slay labels. Not hype.</p>
        </div>
        <p className="mt-6 max-w-[840px] text-[11.5px] leading-relaxed text-brand-muted">
          The Label Slayer provides independent product analysis based on our
          published methodology. We do not provide medical advice, and our content
          does not diagnose, treat, cure, or prevent any disease. Product
          formulations change — always verify the label on the product you
          purchase.
        </p>
      </div>
    </footer>
  );
}

function FooterColumn({
  heading,
  links,
}: {
  heading: string;
  links: { href: string; label: string }[];
}) {
  return (
    <div>
      <h5 className="mb-5 text-[11px] font-bold tracking-[0.2em] text-brass uppercase">
        {heading}
      </h5>
      <div className="flex flex-col gap-3">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            className="text-[13.5px] text-ivory-dim transition-colors hover:text-ivory"
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
