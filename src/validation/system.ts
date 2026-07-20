import { z } from "zod";

/** Body of the manual /api/revalidate escape hatch. */
export const revalidateSchema = z.object({
  tags: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
});
export type RevalidateInput = z.infer<typeof revalidateSchema>;
