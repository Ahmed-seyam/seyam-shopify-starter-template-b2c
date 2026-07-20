import "server-only";
import { collectionFilters, searchSortArgs } from "@/lib/client/catalog/params";
import { reshapeProductCard, type RawProductCard } from "@/lib/server/products";
import type { ProductCard } from "@/types/product";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { flattenConnection, type Connection } from "@/types/shopify";
import type { SearchOptions } from "@/types/search";
import { PREDICTIVE_SEARCH_QUERY, SEARCH_QUERY } from "./_queries";

/**
 * Shopify Storefront search egress. Lives under app/api/search so the Storefront
 * token stays behind Route Handlers only (the Algolia backend hits Algolia
 * directly — see lib/search/algolia). Search results are never statically
 * cached (cache: "no-store").
 */

export async function shopifySearch(
  query: string,
  { locale, limit = 24, catalog }: SearchOptions,
): Promise<ProductCard[]> {
  const filters = catalog ? collectionFilters(catalog) : [];
  const { sortKey, reverse } = searchSortArgs(catalog?.sort ?? "best-selling");

  const data = await storefrontFetch<{ search: Connection<RawProductCard> }>(
    SEARCH_QUERY,
    {
      variables: {
        query,
        first: limit,
        productFilters: filters.length > 0 ? filters : undefined,
        sortKey,
        reverse,
      },
      locale,
      cache: "no-store",
    },
  );

  return flattenConnection(data.search).map(reshapeProductCard);
}

export async function shopifySuggest(
  query: string,
  { locale, limit = 6 }: SearchOptions,
): Promise<ProductCard[]> {
  const data = await storefrontFetch<{
    predictiveSearch: { products: RawProductCard[] };
  }>(PREDICTIVE_SEARCH_QUERY, {
    variables: { query, limit },
    locale,
    cache: "no-store",
  });

  return data.predictiveSearch.products.map(reshapeProductCard);
}
