import "server-only";
import { callApi } from "@/lib/server/api/http";

/**
 * Reconcile the cart's buyer identity with the current auth state (attach the
 * token on sign-in, drop it on sign-out). Called from the account actions right
 * after the customer cookie is set/cleared — callApi forwards that in-request
 * cookie change to /api/cart/buyer-identity. Best-effort; never blocks the
 * auth redirect.
 */
export async function syncCartBuyerIdentity(locale: string): Promise<void> {
  await callApi("/api/cart/buyer-identity", {
    method: "POST",
    auth: true,
    body: { locale },
  });
}
