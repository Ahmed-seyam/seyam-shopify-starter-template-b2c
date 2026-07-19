"use server";

import { z } from "zod";

export type ReviewState = { status: "idle" | "success" | "error" };

const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  body: z.string().min(10).max(2000),
  name: z.string().min(1).max(80),
});

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
