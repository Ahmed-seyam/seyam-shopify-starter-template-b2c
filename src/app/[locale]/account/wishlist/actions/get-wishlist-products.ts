"use server";

import { getProducts } from "@/app/[locale]/products/actions/get-products";
import type { ProductCard } from "@/app/[locale]/products/types";

const MAX_HANDLES = 24;

/**
 * Resolves localStorage wishlist handles to card data. Client-callable — the
 * wishlist lives in the browser, so the page can't fetch this server-side.
 * Returns products in the caller's handle order; unknown handles drop out.
 */
export async function getWishlistProducts(
  handles: string[],
  locale: string
): Promise<ProductCard[]> {
  const clean = [
    ...new Set(
      handles.filter((h) => typeof h === "string" && /^[\w-]+$/.test(h))
    ),
  ].slice(0, MAX_HANDLES);
  if (clean.length === 0) return [];

  try {
    const products = await getProducts(locale, {
      first: clean.length,
      query: clean.map((h) => `handle:${h}`).join(" OR "),
    });
    const byHandle = new Map(products.map((p) => [p.handle, p]));
    return clean.flatMap((h) => byHandle.get(h) ?? []);
  } catch {
    return [];
  }
}
