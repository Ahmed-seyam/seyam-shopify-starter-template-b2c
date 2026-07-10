"use server";

import { cookies } from "next/headers";
import { storefrontFetch } from "@/core/shopify/client";
import { CART_FRAGMENT, type RawCart } from "../queries/cart-fragment";
import { CART_COOKIE } from "../queries/get-cart";

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation cartCreate($lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cartCreate(input: { lines: $lines }) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!, $country: CountryCode, $language: LanguageCode) @inContext(country: $country, language: $language) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;

type CartMutationResult = {
  cart: RawCart | null;
  userErrors: Array<{ field: string[] | null; message: string }>;
};

function assertNoUserErrors(result: CartMutationResult) {
  if (result.userErrors.length > 0) {
    throw new Error(result.userErrors.map((e) => e.message).join("; "));
  }
}

export async function addToCart(
  variantId: string,
  quantity: number = 1,
  locale?: string,
): Promise<void> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  const lines = [{ merchandiseId: variantId, quantity }];

  if (cartId) {
    // Self-heal: a stale/invalid cookie (expired cart, store switch) must
    // not break add-to-cart — fall through and create a fresh cart.
    try {
      const data = await storefrontFetch<{ cartLinesAdd: CartMutationResult }>(
        CART_LINES_ADD_MUTATION,
        { variables: { cartId, lines }, locale, cache: "no-store" },
      );
      assertNoUserErrors(data.cartLinesAdd);
      if (data.cartLinesAdd.cart) return;
    } catch (error) {
      console.warn("[cart] stored cart id rejected, creating a new cart", error);
    }
  }

  // The cart's currency is fixed by the market at creation time.
  const data = await storefrontFetch<{ cartCreate: CartMutationResult }>(
    CART_CREATE_MUTATION,
    { variables: { lines }, locale, cache: "no-store" },
  );
  assertNoUserErrors(data.cartCreate);

  const cart = data.cartCreate.cart;
  if (!cart) throw new Error("Failed to create cart");

  cookieStore.set(CART_COOKIE, cart.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    // Shopify carts live ~10 days; keep the cookie in that window.
    maxAge: 60 * 60 * 24 * 10,
  });
}

export async function updateLineQuantity(
  lineId: string,
  quantity: number,
  locale?: string,
): Promise<void> {
  if (quantity <= 0) return removeLine(lineId, locale);

  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;

  const data = await storefrontFetch<{ cartLinesUpdate: CartMutationResult }>(
    CART_LINES_UPDATE_MUTATION,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      locale,
      cache: "no-store",
    },
  );
  assertNoUserErrors(data.cartLinesUpdate);
}

export async function removeLine(
  lineId: string,
  locale?: string,
): Promise<void> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;

  const data = await storefrontFetch<{ cartLinesRemove: CartMutationResult }>(
    CART_LINES_REMOVE_MUTATION,
    { variables: { cartId, lineIds: [lineId] }, locale, cache: "no-store" },
  );
  assertNoUserErrors(data.cartLinesRemove);
}
