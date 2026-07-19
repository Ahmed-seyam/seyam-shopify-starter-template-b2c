import "server-only";
import { storefrontFetch } from "@/app/core/shopify/client";
import { flattenConnection, type Connection } from "@/app/core/shopify/types";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/app/[locale]/products/actions/reshape";
import { PREDICTIVE_SEARCH_QUERY } from "../queries/predictive-search";
import { SEARCH_QUERY } from "../queries/search-products";
import type { SearchOptions, SearchProvider } from "../types";

export const shopifySearchProvider: SearchProvider = {
  async search(query: string, { locale, limit = 24 }: SearchOptions) {
    const data = await storefrontFetch<{
      search: Connection<RawProductCard>;
    }>(SEARCH_QUERY, {
      variables: { query, first: limit },
      locale,
      // Search results change constantly — keep out of the static cache.
      cache: "no-store",
    });

    return flattenConnection(data.search).map(reshapeProductCard);
  },

  async suggest(query: string, { locale, limit = 6 }: SearchOptions) {
    const data = await storefrontFetch<{
      predictiveSearch: { products: RawProductCard[] };
    }>(PREDICTIVE_SEARCH_QUERY, {
      variables: { query, limit },
      locale,
      cache: "no-store",
    });

    return data.predictiveSearch.products.map(reshapeProductCard);
  },
};
