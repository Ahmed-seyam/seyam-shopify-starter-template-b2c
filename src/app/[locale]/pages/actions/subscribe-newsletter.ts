"use server";

import { z } from "zod";

export type SubscribeState = { status: "idle" | "success" | "error" };

/**
 * Newsletter signup stub. Swap the body for your ESP of choice
 * (Shopify customer w/ marketing consent, Klaviyo, Mailchimp, …).
 */
export async function subscribeNewsletter(
  _prev: SubscribeState,
  formData: FormData
): Promise<SubscribeState> {
  const email = z.string().email().safeParse(formData.get("email"));
  if (!email.success) return { status: "error" };

  return { status: "success" };
}
