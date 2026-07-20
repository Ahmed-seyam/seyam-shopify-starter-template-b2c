import "server-only";
import { callApi } from "@/lib/server/api/http";
import { TAGS } from "@/lib/server/cache/tags";
import type { ProductCard } from "@/types/product";

type GetProductsOptions = {
  first?: number;
  query?: string;
  sortKey?: "TITLE" | "PRICE" | "BEST_SELLING" | "CREATED_AT" | "RELEVANCE";
  reverse?: boolean;
};

/**
 * Server-side client for the product-listing endpoint
 * (`/api/product/get-products`). See getProduct for the caching rationale.
 */
export async function getProducts(
  locale: string,
  { first = 12, query, sortKey, reverse }: GetProductsOptions = {},
): Promise<ProductCard[]> {
  return callApi<ProductCard[]>("/api/product/get-products", {
    searchParams: { first, query, sortKey, reverse, locale },
    tags: [TAGS.products],
    revalidate: 60 * 60 * 24,
  });
}
