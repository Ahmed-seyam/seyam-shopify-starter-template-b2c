"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { getWishlistProducts } from "@/app/[locale]/account/wishlist/_actions/get-wishlist-products";
import { queryKeys } from "@/lib/query/keys";

/**
 * Resolves localStorage wishlist handles to product cards, cached per
 * `['wishlist', locale, handles]`. The handle list itself is UI state owned by
 * `useWishlist` (localStorage); this hook only turns it into server data.
 * Pass any subset of handles (e.g. the popup's latest-3 preview).
 */
export function useWishlistProducts(handles: string[]) {
  const locale = useLocale();

  const query = useQuery({
    queryKey: queryKeys.wishlist(locale, handles),
    queryFn: () => getWishlistProducts(handles, locale),
    enabled: handles.length > 0,
    // Keep the current cards while a changed handle set re-resolves, so
    // removing one item doesn't flash the whole grid to a skeleton.
    placeholderData: keepPreviousData,
  });

  return {
    // `undefined` while first-loading; `[]` once resolved to nothing.
    products: handles.length === 0 ? [] : query.data,
    isLoading: query.isLoading && handles.length > 0,
  };
}
