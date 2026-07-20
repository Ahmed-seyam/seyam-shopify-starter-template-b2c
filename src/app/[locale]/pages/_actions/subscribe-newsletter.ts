"use server";

import { newsletterSchema } from "@/validation/marketing";

export type SubscribeState = { status: "idle" | "success" | "error" };

/**
 * Newsletter signup stub. Swap the body for your ESP of choice
 * (Shopify customer w/ marketing consent, Klaviyo, Mailchimp, …).
 */
export async function subscribeNewsletter(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const parsed = newsletterSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { status: "error" };

  return { status: "success" };
}
