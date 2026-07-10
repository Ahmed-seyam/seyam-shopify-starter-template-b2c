import "server-only";
import { TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import { PRODUCT_CARD_FRAGMENT } from "@/core/shopify/fragments";
import { flattenConnection, type Connection } from "@/core/shopify/types";
import type { ProductCard } from "../types";
import { reshapeProductCard, type RawProductCard } from "./reshape";

const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query getProducts(
    $first: Int!
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          ...ProductCardFragment
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;

type GetProductsOptions = {
  first?: number;
  query?: string;
  sortKey?: "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT" | "RELEVANCE";
  reverse?: boolean;
};

export async function getProducts(
  locale: string,
  { first = 12, query, sortKey, reverse }: GetProductsOptions = {},
): Promise<ProductCard[]> {
  const data = await storefrontFetch<{
    products: Connection<RawProductCard>;
  }>(GET_PRODUCTS_QUERY, {
    variables: { first, query, sortKey, reverse },
    locale,
    tags: [TAGS.products],
  });

  return flattenConnection(data.products).map(reshapeProductCard);
}
