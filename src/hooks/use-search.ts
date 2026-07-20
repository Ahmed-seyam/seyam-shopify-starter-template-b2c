"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { useLocale } from "next-intl";
import { useEffect, useState } from "react";
import { queryKeys } from "@/lib/query/keys";
import type { ProductCard } from "@/types/product";

const MIN_QUERY_LENGTH = 2;
const DEBOUNCE_MS = 250;

/** Debounce a fast-changing value so the query key only settles when idle. */
function useDebouncedValue<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

async function searchProducts(
  query: string,
  locale: string,
  signal?: AbortSignal,
): Promise<ProductCard[]> {
  const params = new URLSearchParams({ q: query, locale });
  const response = await fetch(`/api/search?${params}`, { signal });
  const body = (await response.json()) as { products?: ProductCard[] };
  return body.products ?? [];
}

/**
 * Header/search typeahead. Debounces the raw input, then caches results per
 * `['search', query, locale]` so repeat queries are instant. Replaces the
 * former hand-rolled debounce + AbortController in the popup.
 */
export function useSearch(query: string) {
  const locale = useLocale();
  const debounced = useDebouncedValue(query.trim(), DEBOUNCE_MS);
  const enabled = debounced.length >= MIN_QUERY_LENGTH;

  const searchQuery = useQuery({
    queryKey: queryKeys.search(debounced, locale),
    queryFn: ({ signal }) => searchProducts(debounced, locale, signal),
    enabled,
    // Keep the previous page of results on screen while the next query loads.
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });

  return {
    results: enabled ? (searchQuery.data ?? []) : [],
    isSearching: enabled && searchQuery.isFetching,
    hasQuery: enabled,
  };
}
