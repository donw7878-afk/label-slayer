import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default async function BlogPostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PagePlaceholder
      eyebrow="The intel"
      title={slug.replace(/-/g, " ")}
      description="This article will render here."
    />
  );
}
