"use server";

import { callApi } from "@/lib/server/api/http";

/**
 * Add a variant to the cart via /api/cart/add (self-heal + create live in the
 * handler). The new/refreshed cart cookie is propagated back by callApi.
 */
export async function addToCart(
  variantId: string,
  quantity: number = 1,
  locale?: string,
  /** Line-item properties shown at checkout (gift card recipient, etc.). */
  attributes?: { key: string; value: string }[],
): Promise<void> {
  await callApi("/api/cart/add", {
    method: "POST",
    auth: true,
    body: { variantId, quantity, locale, attributes },
  });
}
