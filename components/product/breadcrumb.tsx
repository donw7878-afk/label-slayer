import Link from "next/link";

export interface Crumb {
  label: string;
  href?: string;
}

/** Home > Products > Snacks > Frito-Lay > Doritos Nacho Cheese */
export function Breadcrumb({ items }: { items: Crumb[] }) {
  return (
    <nav
      aria-label="Breadcrumb"
      className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-brand-muted"
    >
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-brand-muted/60">/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-brass-bright">
              {item.label}
            </Link>
          ) : (
            <span className="text-ivory-dim">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
