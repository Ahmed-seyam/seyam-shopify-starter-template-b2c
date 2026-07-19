"use server";

import { clearSession } from "@/lib/shopify/session";

/**
 * Forget the current cart by deleting its cookie. Used after checkout
 * completes: Shopify has converted the cart to an order, but our cart cookie
 * still points at the (now completed) cart, so getCart would keep showing the
 * purchased items until the cookie is cleared. The next add-to-cart creates a
 * fresh cart.
 */
export async function clearCart(): Promise<void> {
  await clearSession("cart");
}
