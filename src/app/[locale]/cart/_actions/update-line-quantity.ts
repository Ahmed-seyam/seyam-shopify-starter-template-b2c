"use server";

import { storefrontMutation } from "@/lib/shopify/client";
import { getSession } from "@/lib/shopify/session";
import { CART_LINES_UPDATE_MUTATION } from "../_mutations/cart-lines-update";
import type { Cart } from "../_types";
import { removeLine } from "./remove-line";
import {
  CART_SESSION,
  isMissingLine,
  toCart,
  type CartPayload,
} from "./shared";

export async function updateLineQuantity(
  lineId: string,
  quantity: number,
  locale?: string,
): Promise<Cart | null> {
  if (quantity <= 0) return removeLine(lineId, locale);

  const cartId = await getSession("cart");
  if (!cartId) return null;

  const payload = await storefrontMutation<CartPayload>(
    "cartLinesUpdate",
    CART_LINES_UPDATE_MUTATION,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      locale,
      tolerate: isMissingLine,
      session: CART_SESSION,
    },
  );
  return toCart(payload);
}
