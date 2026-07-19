import "server-only";
import { storefrontFetch } from "@/lib/shopify/client";
import { flattenConnection, type Connection } from "@/lib/shopify/types";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/app/[locale]/products/_actions/reshape";
import { PREDICTIVE_SEARCH_QUERY } from "../_queries/predictive-search";
import { SEARCH_QUERY } from "../_queries/search-products";
import type { SearchOptions, SearchProvider } from "../_types";

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
