import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PagePlaceholder
      eyebrow="Product slay"
      title={slug.replace(/-/g, " ")}
      description="The full verdict, score breakdown, ingredient flags, and clean swaps for this product will render here."
    />
  );
}
