import type { ProductCard } from "@/app/[locale]/products/_types";
import type { Cart, CartLine } from "@/app/[locale]/cart/_types";

/** Vendor-neutral event shapes — each adapter maps these to its own schema. */

export type TrackedItem = {
  id: string;
  name: string;
  price: number;
  currency: string;
  quantity?: number;
  /** Product handle — the Algolia objectID, needed for conversion events. */
  handle?: string;
};

export type TrackedOrder = {
  transactionId: string;
  value?: number;
  currency?: string;
  items?: TrackedItem[];
};

export function itemFromProduct(
  product: ProductCard,
  quantity = 1,
): TrackedItem {
  return {
    id: product.id,
    name: product.title,
    price: Number(product.minPrice.amount),
    currency: product.minPrice.currencyCode,
    quantity,
    handle: product.handle,
  };
}

export function itemFromCartLine(line: CartLine): TrackedItem {
  return {
    id: line.merchandise.id,
    name: line.merchandise.product.title,
    price: Number(line.cost.totalAmount.amount) / Math.max(line.quantity, 1),
    currency: line.cost.totalAmount.currencyCode,
    quantity: line.quantity,
    handle: line.merchandise.product.handle,
  };
}

export function cartSummary(cart: Cart): {
  items: TrackedItem[];
  value: number;
  currency: string;
} {
  return {
    items: cart.lines.map(itemFromCartLine),
    value: Number(cart.cost.totalAmount.amount),
    currency: cart.cost.totalAmount.currencyCode,
  };
}
