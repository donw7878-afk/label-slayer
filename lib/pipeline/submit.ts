/**
 * User product submissions — the "we don't have it yet" funnel.
 *
 * Submissions land in product_submissions as 'pending' and wait for review;
 * approved ones get run through the pipeline by an admin flow later.
 */

import {
  findSubmissionByBarcode,
  getProductByBarcode,
  submitProduct,
} from "../database/queries";

export interface SubmitProductInput {
  productName: string;
  brand?: string;
  barcode?: string;
  ingredientsRaw?: string;
  imageUrl?: string;
  submittedBy?: string;
}

export interface SubmitProductResult {
  submissionId: string;
  status: "pending" | "duplicate" | "already-slayed";
  message: string;
}

export async function submitProductForReview(
  input: SubmitProductInput,
): Promise<SubmitProductResult> {
  const barcode = input.barcode?.trim() || undefined;

  if (barcode) {
    // Already slayed? Point them at the existing product instead of queueing.
    const existingProduct = await getProductByBarcode(barcode);
    if (existingProduct) {
      return {
        submissionId: existingProduct.id,
        status: "already-slayed",
        message: `"${existingProduct.name}" is already in the database (/${existingProduct.slug}).`,
      };
    }

    // Already in the review queue? Mark the new one as a duplicate.
    const existingSubmission = await findSubmissionByBarcode(barcode);
    if (existingSubmission) {
      const dup = await submitProduct({
        product_name: input.productName,
        brand: input.brand ?? null,
        barcode,
        ingredients_raw: input.ingredientsRaw ?? null,
        image_url: input.imageUrl ?? null,
        submitted_by: input.submittedBy ?? "anonymous",
        status: "duplicate",
        notes: `Duplicate of submission ${existingSubmission.id}`,
      });
      return {
        submissionId: dup.id,
        status: "duplicate",
        message: "This barcode is already in the review queue.",
      };
    }
  }

  const submission = await submitProduct({
    product_name: input.productName,
    brand: input.brand ?? null,
    barcode: barcode ?? null,
    ingredients_raw: input.ingredientsRaw ?? null,
    image_url: input.imageUrl ?? null,
    submitted_by: input.submittedBy ?? "anonymous",
    status: "pending",
  });

  console.log(
    `Submission: "${input.productName}" queued for review (${submission.id})`,
  );
  return {
    submissionId: submission.id,
    status: "pending",
    message: "Submitted for review. We'll slay it soon.",
  };
}
