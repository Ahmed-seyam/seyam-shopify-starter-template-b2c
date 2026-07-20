import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { Cart } from "../_types";

type GetCartOptions = {
  /**
   * Reprice the cart when its buyer country differs from the locale's market.
   * Only the cart page should pass this: market-agnostic callers (e.g. the
   * header badge/drawer cart read) would otherwise flip the cart back.
   */
  syncBuyerCountry?: boolean;
};

/** Server-side client for the cart read endpoint (/api/cart/get). */
export async function getCart(
  locale: string,
  { syncBuyerCountry = false }: GetCartOptions = {},
): Promise<Cart | null> {
  return callApi<Cart | null>("/api/cart/get", {
    searchParams: { locale, syncBuyerCountry },
    auth: true,
  });
}
