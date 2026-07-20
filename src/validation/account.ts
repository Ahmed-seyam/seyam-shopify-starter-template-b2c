import { z } from "zod";

/**
 * Customer address — validated identically on the client (form UX) and the
 * server (action + /api/account/address route). Import from both sides so the
 * contract never drifts.
 */
export const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
});
export type AddressInput = z.infer<typeof addressSchema>;

/** The keys of {@link addressSchema}, handy for pulling fields off a FormData. */
export const addressFields = Object.keys(addressSchema.shape) as Array<
  keyof AddressInput
>;

/** Profile edit form (name + email, optional password change). */
export const profileSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  acceptsMarketing: z.boolean(),
});
export type ProfileInput = z.infer<typeof profileSchema>;
