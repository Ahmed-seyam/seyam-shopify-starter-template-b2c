import { z } from "zod";

/** Newsletter signup — just an email. */
export const newsletterSchema = z.object({ email: z.email() });
export type NewsletterInput = z.infer<typeof newsletterSchema>;
