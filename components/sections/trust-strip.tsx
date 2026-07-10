import { Container } from "@/components/layout/container";
import { TRUST_STRIP_ITEMS } from "@/lib/constants";

export function TrustStrip() {
  return (
    <div className="border-y border-hairline bg-charcoal py-8">
      <Container className="flex flex-wrap items-center justify-between gap-6">
        {TRUST_STRIP_ITEMS.map((item) => (
          <div
            key={item}
            className="flex items-center gap-3 text-[13px] font-semibold tracking-[0.06em] text-ivory-dim"
          >
            <span className="h-1.5 w-1.5 rotate-45 bg-brass" />
            {item}
          </div>
        ))}
      </Container>
    </div>
  );
}
