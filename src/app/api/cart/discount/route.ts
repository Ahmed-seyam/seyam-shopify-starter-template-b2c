import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import type { RawCart } from "@/fragments";
import { getSession } from "@/plugins/server/shopify/session";
import { CART_DISCOUNT_CODES_UPDATE_MUTATION } from "../_mutations/cart-discount-codes-update";
import { CART_SESSION, toCart, type CartPayload } from "../_shared";

type DiscountBody = { code: string; locale?: string };

type DiscountPayload = CartPayload & {
  cart:
    | (RawCart & { discountCodes?: { code: string; applicable: boolean }[] })
    | null;
};

/** POST /api/cart/discount — reached via applyDiscount (cart/_actions). */
export const POST = route(async (request) => {
  const { code, locale } = (await request.json()) as DiscountBody;

  const cartId = await getSession("cart");
  if (!cartId) return ok({ cart: null, applied: false });

  const trimmed = code.trim();
  const payload = await storefrontMutation<DiscountPayload>(
    "cartDiscountCodesUpdate",
    CART_DISCOUNT_CODES_UPDATE_MUTATION,
    {
      variables: { cartId, discountCodes: trimmed ? [trimmed] : [] },
      locale,
      session: CART_SESSION,
    },
  );

  const applied =
    payload.cart?.discountCodes?.some(
      (discount) =>
        discount.applicable &&
        discount.code.toLowerCase() === trimmed.toLowerCase(),
    ) ?? false;

  return ok({ cart: toCart(payload), applied });
});
