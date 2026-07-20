"use server";

import { getProductsByHandles } from "@/app/[locale]/products/_actions/get-products-by-handles";
import type { ProductCard } from "@/types/product";

const MAX_HANDLES = 24;

/**
 * Resolves localStorage wishlist handles to card data. Client-callable — the
 * wishlist lives in the browser, so the page can't fetch this server-side.
 * Returns products in the caller's handle order; unknown handles drop out.
 */
export async function getWishlistProducts(
  handles: string[],
  locale: string,
): Promise<ProductCard[]> {
  const clean = [
    ...new Set(
      handles.filter((h) => typeof h === "string" && /^[\w-]+$/.test(h)),
    ),
  ].slice(0, MAX_HANDLES);
  if (clean.length === 0) return [];

  // Errors propagate so the caller's query enters an error state rather than a
  // successful-but-empty one — the client prunes "missing" handles only on a
  // genuine success, so a swallowed failure must never look like one.
  return getProductsByHandles(clean, locale);
}
