"use client";

import Link from "next/link";
import { Menu } from "lucide-react";
import { Logo } from "./logo";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const NAV_LINKS = [
  { href: "/how-it-works", label: "How it works" },
  { href: "/products", label: "Database" },
  { href: "/ingredients", label: "Ingredients" },
  { href: "/methodology", label: "Methodology" },
  { href: "/blog", label: "Blog" },
];

export function Nav() {
  return (
    <nav className="fixed inset-x-0 top-0 z-100 border-b border-hairline bg-obsidian/75 backdrop-blur-xl">
      <div className="mx-auto flex h-[72px] max-w-[1280px] items-center justify-between px-6 md:px-8">
        <Logo />
        <div className="hidden items-center gap-9 md:flex">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-[13px] font-medium tracking-[0.04em] text-ivory-dim transition-colors hover:text-ivory"
            >
              {link.label}
            </Link>
          ))}
          <Button
            render={<Link href="/early-access" />}
            nativeButton={false}
            className="rounded-none bg-ivory px-6 py-2.5 text-[12px] font-bold tracking-[0.1em] text-obsidian uppercase hover:bg-brass-bright"
          >
            Join Early Access
          </Button>
        </div>
        <Sheet>
          <SheetTrigger className="text-ivory md:hidden" aria-label="Open menu">
            <Menu className="h-6 w-6" />
          </SheetTrigger>
          <SheetContent
            side="right"
            className="rounded-none border-hairline bg-obsidian text-ivory"
          >
            <SheetHeader>
              <SheetTitle className="text-ivory">
                <Logo />
              </SheetTitle>
            </SheetHeader>
            <div className="flex flex-col gap-6 px-6 pt-4">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm font-medium tracking-[0.04em] text-ivory-dim transition-colors hover:text-ivory"
                >
                  {link.label}
                </Link>
              ))}
              <Button
                render={<Link href="/early-access" />}
                nativeButton={false}
                className="rounded-none bg-ivory py-2.5 text-[12px] font-bold tracking-[0.1em] text-obsidian uppercase hover:bg-brass-bright"
              >
                Join Early Access
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
