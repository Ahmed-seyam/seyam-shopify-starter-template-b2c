import { z } from "zod";

/** Product review submission (shared by the review form and its action). */
export const reviewSchema = z.object({
  rating: z.coerce.number().int().min(1).max(5),
  title: z.string().min(1).max(120),
  body: z.string().min(10).max(2000),
  name: z.string().min(1).max(80),
});
export type ReviewInput = z.infer<typeof reviewSchema>;
