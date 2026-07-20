import { z } from "zod";

/** Login credentials. */
export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(1),
});
export type LoginInput = z.infer<typeof loginSchema>;

/** New-account registration. 8 is a friendly client-visible password floor;
 *  Shopify enforces its own policy on top. */
export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
});
export type RegisterInput = z.infer<typeof registerSchema>;

/** Password-recovery request (email only). */
export const recoverSchema = z.object({ email: z.email() });
export type RecoverInput = z.infer<typeof recoverSchema>;

/** New password on the reset-link page. */
export const resetSchema = z.object({ password: z.string().min(8) });
export type ResetInput = z.infer<typeof resetSchema>;
