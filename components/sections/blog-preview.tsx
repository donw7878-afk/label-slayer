import Link from "next/link";
import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/reveal";
import { SectionHead } from "./section-head";
import { SAMPLE_BLOG_POSTS } from "@/lib/constants";

export function BlogPreview() {
  return (
    <section
      id="blog"
      className="border-t border-hairline bg-charcoal py-28"
    >
      <Container>
        <SectionHead eyebrow="The intel" heading="Label lies, decoded" />
        <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
          {SAMPLE_BLOG_POSTS.map((post, i) => (
            <Reveal key={post.slug} delay={i * 0.08}>
              <Link
                href={`/blog/${post.slug}`}
                className="block h-full overflow-hidden border border-hairline bg-charcoal transition-all duration-300 hover:-translate-y-1 hover:border-brass/40"
              >
                <div className="flex aspect-16/10 items-center justify-center border-b border-hairline bg-linear-to-br from-charcoal-2 to-obsidian">
                  <span className="text-[10px] tracking-[0.2em] text-brand-muted uppercase">
                    Feature image
                  </span>
                </div>
                <div className="p-6.5">
                  <div className="mb-3 text-[10px] font-bold tracking-[0.2em] text-ember uppercase">
                    {post.category}
                  </div>
                  <h4 className="mb-2.5 text-[17px] leading-snug font-bold normal-case">
                    {post.title}
                  </h4>
                  <p className="text-[13px] leading-relaxed text-ivory-dim">
                    {post.excerpt}
                  </p>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
