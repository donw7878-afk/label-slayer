import { PagePlaceholder } from "@/components/layout/page-placeholder";

export default async function IngredientPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PagePlaceholder
      eyebrow="Ingredient intel"
      title={slug.replace(/-/g, " ")}
      description="What this ingredient is, where it hides, and why we flag it will render here."
    />
  );
}
