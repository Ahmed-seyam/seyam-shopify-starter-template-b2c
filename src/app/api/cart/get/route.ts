import { ok, route } from "@/lib/server/api/route";
import { storefrontFetch, storefrontMutation } from "@/plugins/server/shopify/client";
import type { RawCart } from "@/fragments";
import { getSession } from "@/plugins/server/shopify/session";
import { parseLocale } from "@/i18n/routing";
import { CART_BUYER_IDENTITY_UPDATE_MUTATION } from "../_mutations/cart-buyer-identity-update";
import { buildBuyerIdentity } from "../_buyer-identity";
import { CART_SESSION, reshapeCart, type CartPayload } from "../_shared";
import { GET_CART_QUERY } from "../_query";

/**
 * GET /api/cart/get?locale=&syncBuyerCountry=
 *
 * Per-user (auth: forwards the cart cookie). Reached via getCart (cart/_actions).
 * Stale/invalid cookie resolves to an empty cart rather than a 500.
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? undefined;
  const syncBuyerCountry = searchParams.get("syncBuyerCountry") === "true";

  const cartId = await getSession("cart");
  if (!cartId) return ok(null);

  try {
    const data = await storefrontFetch<{ cart: RawCart | null }>(
      GET_CART_QUERY,
      { variables: { cartId }, locale, cache: "no-store" },
    );
    if (!data.cart) return ok(null);

    if (syncBuyerCountry) {
      const synced = await syncCartCountry(data.cart, locale);
      if (synced) return ok(synced);
    }

    return ok(reshapeCart(data.cart));
  } catch {
    // Stale/invalid cookie must not 500 the page — treat as empty cart; the
    // next add-to-cart replaces the cookie with a fresh cart.
    return ok(null);
  }
});

async function syncCartCountry(cart: RawCart, locale: string | undefined) {
  const targetCountry = locale ? parseLocale(locale).country : undefined;
  if (!targetCountry || cart.buyerIdentity?.countryCode === targetCountry) {
    return null;
  }

  try {
    // Send the FULL identity (country + any customer token) — this mutation
    // replaces buyerIdentity, so a country-only update would drop the customer
    // link that ties the cart to a signed-in shopper's checkout.
    const payload = await storefrontMutation<CartPayload>(
      "cartBuyerIdentityUpdate",
      CART_BUYER_IDENTITY_UPDATE_MUTATION,
      {
        variables: {
          cartId: cart.id,
          buyerIdentity: await buildBuyerIdentity(locale),
        },
        locale,
        session: CART_SESSION,
      },
    );
    return payload.cart ? reshapeCart(payload.cart) : null;
  } catch (error) {
    // Repricing is best-effort — a failure still shows the cart.
    console.warn("[cart] buyer country sync failed", error);
    return null;
  }
}
