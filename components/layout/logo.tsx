import Link from "next/link";
import { cn } from "@/lib/utils";

export function Logo({ className }: { className?: string }) {
  return (
    <Link href="/" className={cn("flex items-center gap-3", className)}>
      <span className="relative flex h-[38px] w-[38px] shrink-0 items-center justify-center overflow-hidden border-[1.5px] border-brass">
        <span className="text-sm font-extrabold tracking-wide text-ivory">LS</span>
        <span className="absolute h-[1.5px] w-[150%] -rotate-[38deg] bg-ember" />
      </span>
      <span className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-ivory">
        The Label <span className="text-brass">Slayer</span>
      </span>
    </Link>
  );
}
