import "server-only";
import { storefrontFetch } from "@/core/shopify/client";
import { PRODUCT_CARD_FRAGMENT } from "@/core/shopify/fragments";
import { flattenConnection, type Connection } from "@/core/shopify/types";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/domains/product/queries/reshape";
import type { SearchOptions, SearchProvider } from "../types";

const SEARCH_QUERY = /* GraphQL */ `
  query searchProducts(
    $query: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      edges {
        node {
          ... on Product {
            ...ProductCardFragment
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query predictiveSearch(
    $query: String!
    $limit: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, limit: $limit, types: [PRODUCT]) {
      products {
        ...ProductCardFragment
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

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
