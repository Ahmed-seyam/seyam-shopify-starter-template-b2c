"use server";

import { getSearchProvider } from "@/app/[locale]/search";
import type { ProductCard } from "@/app/[locale]/products/types";

/** Live suggestions for the header search popup. */
export async function suggestProducts(
  query: string,
  locale: string
): Promise<ProductCard[]> {
  const trimmed = query.trim();
  if (trimmed.length < 2) return [];

  try {
    return await getSearchProvider().suggest(trimmed, { locale, limit: 4 });
  } catch {
    // Suggestions are best-effort — a misconfigured store must not
    // break the header.
    return [];
  }
}
