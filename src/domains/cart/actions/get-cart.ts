import "server-only";
import { storefrontFetch } from "@/core/shopify/client";
import { getSession } from "@/core/shopify/session";
import type { RawCart } from "../fragments";
import { GET_CART_QUERY } from "../queries/get-cart";
import type { Cart } from "../types";
import { reshapeCart } from "./shared";

/** Cart is per-user runtime data — never statically cached. */
export async function getCart(locale: string): Promise<Cart | null> {
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
    return data.cart ? reshapeCart(data.cart) : null;
  } catch {
    // Stale/invalid cookie must not 500 the page — treat as empty cart;
    // the next add-to-cart replaces the cookie with a fresh cart.
    return null;
  }
}
