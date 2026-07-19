"use server";

import { storefrontMutation } from "@/app/core/shopify/client";
import { getSession } from "@/app/core/shopify/session";
import { CART_CREATE_MUTATION } from "../mutations/cart-create";
import { CART_LINES_ADD_MUTATION } from "../mutations/cart-lines-add";
import { buyerIdentityForNewCart } from "./buyer-identity";
import { CART_SESSION, type CartPayload } from "./shared";

export async function addToCart(
  variantId: string,
  quantity: number = 1,
  locale?: string,
  /** Line-item properties shown at checkout (gift card recipient, etc.). */
  attributes?: { key: string; value: string }[],
): Promise<void> {
  const cartId = await getSession("cart");
  const lines = [
    {
      merchandiseId: variantId,
      quantity,
      ...(attributes?.length ? { attributes } : {}),
    },
  ];

  if (cartId) {
    // Self-heal: a stale/invalid cookie (expired cart, store switch) must
    // not break add-to-cart — fall through and create a fresh cart.
    try {
      const payload = await storefrontMutation<CartPayload>(
        "cartLinesAdd",
        CART_LINES_ADD_MUTATION,
        { variables: { cartId, lines }, locale, session: CART_SESSION },
      );
      if (payload.cart) return;
    } catch (error) {
      console.warn(
        "[cart] stored cart id rejected, creating a new cart",
        error,
      );
    }
  }

  // The cart's currency is fixed by the market at creation time. A signed-in
  // shopper's new cart is linked to their customer account up front, so the
  // Shopify checkout is attributed to them (guests pass no buyer identity).
  const buyerIdentity = await buyerIdentityForNewCart(locale);
  const payload = await storefrontMutation<CartPayload>(
    "cartCreate",
    CART_CREATE_MUTATION,
    { variables: { lines, buyerIdentity }, locale, session: CART_SESSION },
  );
  if (!payload.cart) throw new Error("Failed to create cart");
}
