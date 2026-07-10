import "server-only";
import { cookies } from "next/headers";
import { storefrontFetch } from "@/core/shopify/client";
import { flattenConnection } from "@/core/shopify/types";
import type { Cart } from "../types";
import { CART_FRAGMENT, type RawCart } from "./cart-fragment";

export const CART_COOKIE = "cartId";

const GET_CART_QUERY = /* GraphQL */ `
  query getCart(
    $cartId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${CART_FRAGMENT}
`;

export function reshapeCart(raw: RawCart): Cart {
  return {
    id: raw.id,
    checkoutUrl: raw.checkoutUrl,
    totalQuantity: raw.totalQuantity,
    cost: raw.cost,
    lines: flattenConnection(raw.lines),
  };
}

/** Cart is per-user runtime data — never statically cached. */
export async function getCart(locale: string): Promise<Cart | null> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return null;

  const data = await storefrontFetch<{ cart: RawCart | null }>(
    GET_CART_QUERY,
    {
      variables: { cartId },
      locale,
      cache: "no-store",
    },
  );

  return data.cart ? reshapeCart(data.cart) : null;
}
