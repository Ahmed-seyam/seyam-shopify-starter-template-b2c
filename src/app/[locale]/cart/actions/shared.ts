import "server-only";
import type { UserError } from "@/app/core/shopify/client";
import { flattenConnection } from "@/app/core/shopify/types";
import type { RawCart } from "../fragments";
import type { Cart } from "../types";

/** Payload shape shared by all cart mutations. */
export type CartPayload = {
  cart: RawCart | null;
  userErrors: UserError[];
};

/**
 * Session sync for every cart mutation (core/shopify/session does the
 * cookie work) — the cart id Shopify RETURNS is persisted automatically,
 * covering re-issued carts a stale cookie would otherwise orphan.
 */
export const CART_SESSION = {
  key: "cart",
  extract: (payload: CartPayload) => payload.cart?.id,
} as const;

// Tolerated for remove/update only: a line that's already gone means the
// desired end-state is met (double-click, stale row). Deliberately does NOT
// match the cart-level "The specified cart does not exist." — swallowing
// that one breaks add-to-cart's stale-cookie self-heal, because Shopify then
// silently creates a new cart whose id we'd never persist.
export const isMissingLine = (error: UserError) =>
  /merchandise line .* does not exist/i.test(error.message);

export function reshapeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: flattenConnection(raw.lines),
  };
}

export function toCart(payload: CartPayload): Cart | null {
  return payload.cart ? reshapeCart(payload.cart) : null;
}
