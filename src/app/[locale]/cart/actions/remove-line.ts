"use server";

import { storefrontMutation } from "@/app/core/shopify/client";
import { getSession } from "@/app/core/shopify/session";
import { CART_LINES_REMOVE_MUTATION } from "../mutations/cart-lines-remove";
import type { Cart } from "../types";
import {
  CART_SESSION,
  isMissingLine,
  toCart,
  type CartPayload,
} from "./shared";

export async function removeLine(
  lineId: string,
  locale?: string,
): Promise<Cart | null> {
  const cartId = await getSession("cart");
  if (!cartId) return null;

  const payload = await storefrontMutation<CartPayload>(
    "cartLinesRemove",
    CART_LINES_REMOVE_MUTATION,
    {
      variables: { cartId, lineIds: [lineId] },
      locale,
      tolerate: isMissingLine,
      session: CART_SESSION,
    },
  );
  return toCart(payload);
}
