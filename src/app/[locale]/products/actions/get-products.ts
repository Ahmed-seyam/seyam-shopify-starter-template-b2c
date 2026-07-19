import "server-only";
import { TAGS } from "@/app/core/cache/tags";
import { storefrontFetch } from "@/app/core/shopify/client";
import { flattenConnection, type Connection } from "@/app/core/shopify/types";
import { GET_PRODUCTS_QUERY } from "../queries/get-products";
import type { ProductCard } from "../types";
import { reshapeProductCard, type RawProductCard } from "./reshape";

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
