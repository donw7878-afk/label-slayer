/**
 * Admin manual name override: POST { slug, newName } with the x-admin-secret
 * header. Updates the product's name and regenerates its slug from the new
 * name. The stored name_raw (original API name) is left untouched so the
 * provenance stays visible in the admin dashboard.
 */

import { isAdminRequest, unauthorized } from "@/lib/admin/auth";
import { getProductBySlug } from "@/lib/database/queries";
import { getServerClient } from "@/lib/database/supabase";
import { productSlug } from "@/lib/pipeline";

interface RenameBody {
  slug?: string;
  newName?: string;
}

export async function POST(request: Request) {
  if (!isAdminRequest(request)) return unauthorized();

  let body: RenameBody;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const slug = body.slug?.trim();
  const newName = body.newName?.trim();
  if (!slug || !newName) {
    return Response.json(
      { error: "Both slug and newName are required" },
      { status: 400 },
    );
  }

  const product = await getProductBySlug(slug);
  if (!product) {
    return Response.json(
      { error: `No product found for slug "${slug}"` },
      { status: 404 },
    );
  }

  const newSlug = productSlug(newName, product.brand);
  if (newSlug !== product.slug) {
    const taken = await getProductBySlug(newSlug);
    if (taken) {
      return Response.json(
        { error: `Slug "${newSlug}" is already used by "${taken.name}"` },
        { status: 409 },
      );
    }
  }

  const client = getServerClient();
  const { data, error } = await client
    .from("products")
    .update({ name: newName, slug: newSlug })
    .eq("id", product.id)
    .select("slug, name, name_raw")
    .single();
  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({
    ok: true,
    previousName: product.name,
    previousSlug: product.slug,
    product: data,
  });
}
