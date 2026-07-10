"use server";

import { cookies } from "next/headers";
import { storefrontFetch } from "@/core/shopify/client";
import { CART_FRAGMENT, type RawCart } from "../queries/cart-fragment";
import { CART_COOKIE } from "../queries/get-cart";

const CART_CREATE_MUTATION = /* GraphQL */ `
  mutation cartCreate($lines: [CartLineInput!]!) {
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
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
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
  mutation cartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
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
  mutation cartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
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
): Promise<void> {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  const lines = [{ merchandiseId: variantId, quantity }];

  if (cartId) {
    const data = await storefrontFetch<{ cartLinesAdd: CartMutationResult }>(
      CART_LINES_ADD_MUTATION,
      { variables: { cartId, lines }, cache: "no-store" },
    );
    assertNoUserErrors(data.cartLinesAdd);
    if (data.cartLinesAdd.cart) return;
    // Cart expired on Shopify's side — fall through and create a new one.
  }

  const data = await storefrontFetch<{ cartCreate: CartMutationResult }>(
    CART_CREATE_MUTATION,
    { variables: { lines }, cache: "no-store" },
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
): Promise<void> {
  if (quantity <= 0) return removeLine(lineId);

  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;

  const data = await storefrontFetch<{ cartLinesUpdate: CartMutationResult }>(
    CART_LINES_UPDATE_MUTATION,
    {
      variables: { cartId, lines: [{ id: lineId, quantity }] },
      cache: "no-store",
    },
  );
  assertNoUserErrors(data.cartLinesUpdate);
}

export async function removeLine(lineId: string): Promise<void> {
  const cartId = (await cookies()).get(CART_COOKIE)?.value;
  if (!cartId) return;

  const data = await storefrontFetch<{ cartLinesRemove: CartMutationResult }>(
    CART_LINES_REMOVE_MUTATION,
    { variables: { cartId, lineIds: [lineId] }, cache: "no-store" },
  );
  assertNoUserErrors(data.cartLinesRemove);
}
