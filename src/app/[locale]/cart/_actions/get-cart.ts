import "server-only";
import { storefrontFetch, storefrontMutation } from "@/lib/shopify/client";
import { getSession } from "@/lib/shopify/session";
import { parseLocale } from "@/i18n/routing";
import type { RawCart } from "@/app/fragments";
import { CART_BUYER_IDENTITY_UPDATE_MUTATION } from "../_mutations/cart-buyer-identity-update";
import { GET_CART_QUERY } from "../_queries/get-cart";
import type { Cart } from "../_types";
import { buildBuyerIdentity } from "./buyer-identity";
import { CART_SESSION, reshapeCart, type CartPayload } from "./shared";

type GetCartOptions = {
  /**
   * Reprice the cart when its buyer country differs from the locale's market
   * (a cart's currency is pinned to the buyerIdentity it was created with —
   * switching /en-sa → /en-us would otherwise keep showing SAR). Only the
   * cart page should pass this: market-agnostic callers like /api/cart/count
   * use the default locale and would flip the cart back on every poll.
   */
  syncBuyerCountry?: boolean;
};

/** Cart is per-user runtime data — never statically cached. */
export async function getCart(
  locale: string,
  { syncBuyerCountry = false }: GetCartOptions = {},
): Promise<Cart | null> {
  const cartId = await getSession("cart");
  if (!cartId) return null;

  try {
    const data = await storefrontFetch<{ cart: RawCart | null }>(
      GET_CART_QUERY,
      {
        variables: { cartId },
        locale,
        cache: "no-store",
      },
    );
    if (!data.cart) return null;

    if (syncBuyerCountry) {
      const synced = await syncCartCountry(data.cart, locale);
      if (synced) return synced;
    }

    return reshapeCart(data.cart);
  } catch {
    // Stale/invalid cookie must not 500 the page — treat as empty cart;
    // the next add-to-cart replaces the cookie with a fresh cart.
    return null;
  }
}

async function syncCartCountry(
  cart: RawCart,
  locale: string,
): Promise<Cart | null> {
  const targetCountry = parseLocale(locale).country;
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
    // Repricing is best-effort — a failure still shows the cart, just in
    // its previous currency.
    console.warn("[cart] buyer country sync failed", error);
    return null;
  }
}
