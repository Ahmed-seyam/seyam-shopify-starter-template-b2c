"use server";

import { storefrontMutation } from "@/app/core/shopify/client";
import { getSession } from "@/app/core/shopify/session";
import type { RawCart } from "../fragments";
import { CART_DISCOUNT_CODES_UPDATE_MUTATION } from "../mutations/cart-discount-codes-update";
import type { Cart } from "../types";
import { CART_SESSION, toCart, type CartPayload } from "./shared";

type DiscountPayload = CartPayload & {
  cart: (RawCart & { discountCodes?: { code: string; applicable: boolean }[] }) | null;
};

export type ApplyDiscountResult = {
  cart: Cart | null;
  /** False when Shopify accepted the mutation but the code isn't applicable. */
  applied: boolean;
};

export async function applyDiscount(
  code: string,
  locale?: string
): Promise<ApplyDiscountResult> {
  const cartId = await getSession("cart");
  if (!cartId) return { cart: null, applied: false };

  const trimmed = code.trim();
  const payload = await storefrontMutation<DiscountPayload>(
    "cartDiscountCodesUpdate",
    CART_DISCOUNT_CODES_UPDATE_MUTATION,
    {
      variables: { cartId, discountCodes: trimmed ? [trimmed] : [] },
      locale,
      session: CART_SESSION,
    }
  );

  const applied =
    payload.cart?.discountCodes?.some(
      (discount) =>
        discount.applicable &&
        discount.code.toLowerCase() === trimmed.toLowerCase()
    ) ?? false;

  return { cart: toCart(payload), applied };
}
