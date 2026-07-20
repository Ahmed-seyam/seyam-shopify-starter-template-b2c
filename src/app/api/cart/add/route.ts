import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getSession } from "@/plugins/server/shopify/session";
import { CART_CREATE_MUTATION } from "../_mutations/cart-create";
import { CART_LINES_ADD_MUTATION } from "../_mutations/cart-lines-add";
import { buyerIdentityForNewCart } from "../_buyer-identity";
import { CART_SESSION, toCart, type CartPayload } from "../_shared";

type AddBody = {
  variantId: string;
  quantity?: number;
  locale?: string;
  attributes?: { key: string; value: string }[];
};

/**
 * POST /api/cart/add
 *
 * Add-to-cart with stale-cookie self-heal: a rejected cart id falls through to
 * a fresh cart. Reached via addToCart (cart/_actions). The mutation persists the
 * (possibly re-issued) cart id, which callApi propagates as a cookie.
 */
export const POST = route(async (request) => {
  const { variantId, quantity = 1, locale, attributes } =
    (await request.json()) as AddBody;

  const cartId = await getSession("cart");
  const lines = [
    {
      merchandiseId: variantId,
      quantity,
      ...(attributes?.length ? { attributes } : {}),
    },
  ];

  if (cartId) {
    try {
      const payload = await storefrontMutation<CartPayload>(
        "cartLinesAdd",
        CART_LINES_ADD_MUTATION,
        { variables: { cartId, lines }, locale, session: CART_SESSION },
      );
      if (payload.cart) return ok(toCart(payload));
    } catch (error) {
      console.warn("[cart] stored cart id rejected, creating a new cart", error);
    }
  }

  // A signed-in shopper's new cart is linked to their customer account up front
  // so the Shopify checkout is attributed to them (guests pass no identity).
  const buyerIdentity = await buyerIdentityForNewCart(locale);
  const payload = await storefrontMutation<CartPayload>(
    "cartCreate",
    CART_CREATE_MUTATION,
    { variables: { lines, buyerIdentity }, locale, session: CART_SESSION },
  );
  if (!payload.cart) throw new Error("Failed to create cart");

  return ok(toCart(payload));
});
