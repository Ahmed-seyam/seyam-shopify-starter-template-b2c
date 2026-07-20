/**
 * Central registry of TanStack Query keys. Every hook builds its keys from
 * here so cache reads, writes, and invalidations stay in sync — never inline a
 * raw string array at a call site.
 */
export const queryKeys = {
  cart: () => ["cart"] as const,
  wishlist: (locale: string, handles: readonly string[]) =>
    ["wishlist", locale, handles.join(",")] as const,
  customer: () => ["customer"] as const,
  orders: () => ["orders"] as const,
  order: (id: string) => ["order", id] as const,
  addresses: () => ["addresses"] as const,
  search: (query: string, locale: string) =>
    ["search", query, locale] as const,
} as const;
