"use client";

import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { addToCart } from "@/app/[locale]/cart/_actions/add-to-cart";
import {
  applyDiscount,
  type ApplyDiscountResult,
} from "@/app/[locale]/cart/_actions/apply-discount";
import { clearCart } from "@/app/[locale]/cart/_actions/clear-cart";
import { fetchCart } from "@/app/[locale]/cart/_actions/fetch-cart";
import { removeLine } from "@/app/[locale]/cart/_actions/remove-line";
import { updateLineQuantity } from "@/app/[locale]/cart/_actions/update-line-quantity";
import type { Cart, CartLine } from "@/app/[locale]/cart/_types";
import { queryKeys } from "@/lib/query/keys";
import type { Money } from "@/types/shopify";

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

function money(amount: number, currencyCode: string): Money {
  return { amount: amount.toFixed(2), currencyCode };
}

// Client-side projection of a line mutation so the UI moves instantly; the
// authoritative cart (real tax/discount math) replaces it when the server
// action resolves. Ported from the former use-cart-state.
function recompute(cart: Cart, lines: CartLine[]): Cart {
  const currency = cart.cost.subtotalAmount.currencyCode;
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.cost.totalAmount.amount),
    0,
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

function withoutLine(cart: Cart, lineId: string): Cart {
  return recompute(
    cart,
    cart.lines.filter((line) => line.id !== lineId),
  );
}

function withQuantity(cart: Cart, lineId: string, quantity: number): Cart {
  const lines = cart.lines.map((line) => {
    if (line.id !== lineId) return line;
    const unit = Number(line.cost.totalAmount.amount) / line.quantity;
    return {
      ...line,
      quantity,
      cost: {
        totalAmount: money(unit * quantity, line.cost.totalAmount.currencyCode),
      },
    };
  });
  return recompute(cart, lines);
}

type OptimisticContext = { previous: Cart | undefined };

/**
 * Single source of truth for the cart across the header badge, drawer, and
 * cart page (spec #s-cart). One `['cart']` query replaces the former
 * per-component caches + `cart:updated` window-event bus; line edits apply
 * optimistically and reconcile with each mutation's authoritative cart.
 *
 * Pass `initialCart` from a server component (e.g. the cart page) to seed the
 * cache and avoid a fetch-on-mount flash.
 */
export function useCart(initialCart?: Cart | null) {
  const locale = useLocale();
  const queryClient = useQueryClient();
  const key = queryKeys.cart();

  const cartQuery = useQuery({
    queryKey: key,
    queryFn: () => fetchCart(locale),
    ...(initialCart !== undefined ? { initialData: initialCart } : {}),
  });

  const cart = cartQuery.data ?? EMPTY_CART;

  // Optimistic scaffolding shared by the line-edit mutations: freeze inflight
  // refetches, snapshot for rollback, then project the change into the cache.
  async function beginOptimistic(next: (cart: Cart) => Cart) {
    await queryClient.cancelQueries({ queryKey: key });
    const previous = queryClient.getQueryData<Cart | null>(key) ?? undefined;
    queryClient.setQueryData<Cart>(key, next(previous ?? EMPTY_CART));
    return { previous } satisfies OptimisticContext;
  }

  function rollback(context: OptimisticContext | undefined) {
    if (context) queryClient.setQueryData(key, context.previous);
  }

  const addMutation = useMutation({
    mutationFn: (input: {
      variantId: string;
      quantity?: number;
      attributes?: { key: string; value: string }[];
    }) =>
      addToCart(input.variantId, input.quantity ?? 1, locale, input.attributes),
    // addToCart returns void (the new line id isn't known here), so refetch the
    // authoritative cart rather than projecting.
    onSuccess: () => queryClient.invalidateQueries({ queryKey: key }),
  });

  const updateMutation = useMutation({
    mutationFn: (input: { lineId: string; quantity: number }) =>
      updateLineQuantity(input.lineId, input.quantity, locale),
    onMutate: (input) =>
      beginOptimistic((current) =>
        withQuantity(current, input.lineId, input.quantity),
      ),
    onError: (_error, _input, context) => rollback(context),
    onSuccess: (updated) => queryClient.setQueryData(key, updated ?? EMPTY_CART),
  });

  const removeMutation = useMutation({
    mutationFn: (input: { lineId: string }) => removeLine(input.lineId, locale),
    onMutate: (input) =>
      beginOptimistic((current) => withoutLine(current, input.lineId)),
    onError: (_error, _input, context) => rollback(context),
    onSuccess: (updated) => queryClient.setQueryData(key, updated ?? EMPTY_CART),
  });

  const discountMutation = useMutation({
    mutationFn: (code: string) => applyDiscount(code, locale),
    onSuccess: (result: ApplyDiscountResult) => {
      if (result.cart) queryClient.setQueryData(key, result.cart);
    },
  });

  const clearMutation = useMutation({
    mutationFn: () => clearCart(),
    onSuccess: () => queryClient.setQueryData(key, EMPTY_CART),
  });

  const subtotal = cart.cost.subtotalAmount;
  const total = cart.cost.totalAmount;
  const itemCount = cart.totalQuantity;

  const isMutating =
    updateMutation.isPending ||
    removeMutation.isPending ||
    addMutation.isPending ||
    clearMutation.isPending;

  return {
    cart,
    lines: cart.lines,
    subtotal,
    total,
    itemCount,
    isEmpty: cart.lines.length === 0,
    // Only a real first load (no seeded/cached data) counts as loading.
    isLoading: cartQuery.isLoading && cartQuery.data === undefined,
    isMutating,
    isApplyingCoupon: discountMutation.isPending,
    refresh: () => queryClient.invalidateQueries({ queryKey: key }),

    /** Add a variant to the cart. Returns a promise so callers can toast/track. */
    addItem: (
      variantId: string,
      quantity = 1,
      attributes?: { key: string; value: string }[],
    ) => addMutation.mutateAsync({ variantId, quantity, attributes }),

    /** Set a line's quantity (<= 0 removes it at the endpoint). Optimistic. */
    updateQuantity: (lineId: string, quantity: number) =>
      updateMutation.mutateAsync({ lineId, quantity }),

    /** Remove a line. Optimistic. */
    removeItem: (lineId: string) => removeMutation.mutateAsync({ lineId }),

    /** Apply a discount code. Resolves to whether Shopify accepted it. */
    applyCoupon: async (code: string) => {
      const result = await discountMutation.mutateAsync(code);
      return result.applied;
    },

    /** Forget the cart cookie (post-checkout). */
    clear: () => clearMutation.mutateAsync(),
  };
}
