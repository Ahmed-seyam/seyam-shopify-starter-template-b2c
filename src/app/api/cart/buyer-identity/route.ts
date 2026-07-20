import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getSession } from "@/plugins/server/shopify/session";
import { CART_BUYER_IDENTITY_UPDATE_MUTATION } from "../_mutations/cart-buyer-identity-update";
import { buildBuyerIdentity } from "../_buyer-identity";
import { CART_SESSION, type CartPayload } from "../_shared";

type BuyerIdentityBody = { locale: string };

/**
 * POST /api/cart/buyer-identity — reached via syncCartBuyerIdentity
 * (cart/_actions), called after any sign-in / sign-out. Best-effort: reconciles
 * the cart's identity with the current auth state (the forwarded cookie already
 * reflects the token just set / cleared this request). Never blocks the redirect.
 */
export const POST = route(async (request) => {
  const { locale } = (await request.json()) as BuyerIdentityBody;

  const cartId = await getSession("cart");
  if (!cartId) return ok(null);

  try {
    await storefrontMutation<CartPayload>(
      "cartBuyerIdentityUpdate",
      CART_BUYER_IDENTITY_UPDATE_MUTATION,
      {
        variables: { cartId, buyerIdentity: await buildBuyerIdentity(locale) },
        locale,
        session: CART_SESSION,
      },
    );
  } catch (error) {
    console.warn("[cart] buyer identity sync failed", error);
  }

  return ok(null);
});
