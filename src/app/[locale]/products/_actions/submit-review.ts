"use server";

import { reviewSchema, type ReviewInput } from "@/validation/product";

export type ReviewFieldErrors = Partial<Record<keyof ReviewInput, string>>;
export type ReviewState = {
  status: "idle" | "success" | "error";
  /** Per-field messages, populated by the client-side pre-validation. */
  fieldErrors?: ReviewFieldErrors;
};

/**
 * Review submission stub — validates and accepts. Wire to a reviews app
 * (Judge.me, Okendo, …) or a metaobject-backed store when one is chosen.
 */
export async function submitReview(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const parsed = reviewSchema.safeParse({
    rating: formData.get("rating"),
    title: formData.get("title"),
    body: formData.get("body"),
    name: formData.get("name"),
  });

  return { status: parsed.success ? "success" : "error" };
}
