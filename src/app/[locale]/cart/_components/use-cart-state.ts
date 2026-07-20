"use client";

import { useLocale } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import type { Money } from "@/types/shopify";
// Direct imports from the 'use server' files — the domain barrel re-exports
// server-only queries that must not enter this client bundle.
import { removeLine } from "../_actions/remove-line";
import { itemFromCartLine, track } from "@/plugins/client/tracking";
import { updateLineQuantity } from "../_actions/update-line-quantity";
import type { Cart, CartLine } from "../_types";

export const EMPTY_CART: Cart = {
  id: "",
  checkoutUrl: "",
  totalQuantity: 0,
  cost: {
    subtotalAmount: { amount: "0", currencyCode: "USD" },
    totalAmount: { amount: "0", currencyCode: "USD" },
  },
  lines: [],
};

type OptimisticEvent =
  | { type: "remove"; lineId: string }
  | { type: "quantity"; lineId: string; quantity: number };

function money(amount: number, currencyCode: string): Money {
  return { amount: amount.toFixed(2), currencyCode };
}

// Client-side projection of a mutation so the UI moves instantly; the real
// cart (with authoritative tax/discount math) replaces it when the server
// action resolves.
function recompute(cart: Cart, lines: CartLine[]): Cart {
  const currency = cart.cost.subtotalAmount.currencyCode;
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.cost.totalAmount.amount),
    0
  );
  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    cost: {
      subtotalAmount: money(subtotal, currency),
      totalAmount: money(subtotal, currency),
    },
  };
}

function applyEvent(cart: Cart, event: OptimisticEvent): Cart {
  if (event.type === "remove") {
    return recompute(
      cart,
      cart.lines.filter((line) => line.id !== event.lineId)
    );
  }

  const lines = cart.lines.map((line) => {
    if (line.id !== event.lineId) return line;
    const unit = Number(line.cost.totalAmount.amount) / line.quantity;
    return {
      ...line,
      quantity: event.quantity,
      cost: {
        totalAmount: money(
          unit * event.quantity,
          line.cost.totalAmount.currencyCode
        ),
      },
    };
  });
  return recompute(cart, lines);
}

/**
 * Shared optimistic cart state for the drawer and the cart page: line edits
 * apply instantly and reconcile with each mutation's returned cart.
 */
export function useCartState(initialCart: Cart | null) {
  const locale = useLocale();
  const [cart, setCart] = useState<Cart>(initialCart ?? EMPTY_CART);
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, applyEvent);
  const [pending, startTransition] = useTransition();

  function mutate(event: OptimisticEvent, action: () => Promise<Cart | null>) {
    startTransition(async () => {
      applyOptimistic(event);
      const updated = await action();
      // Reconcile with the server's authoritative cart (or empty it if the
      // cart cookie is gone) — no full-page refresh.
      setCart(updated ?? recompute(cart, []));
      window.dispatchEvent(new Event("cart:updated"));
    });
  }

  const setQuantity = (line: CartLine, quantity: number) => {
    if (quantity <= 0) return remove(line);
    mutate({ type: "quantity", lineId: line.id, quantity }, () =>
      updateLineQuantity(line.id, quantity, locale)
    );
  };

  const remove = (line: CartLine) => {
    track.removeFromCart(itemFromCartLine(line));
    mutate({ type: "remove", lineId: line.id }, () =>
      removeLine(line.id, locale)
    );
  };

  return { cart: optimisticCart, setCart, pending, setQuantity, remove };
}
