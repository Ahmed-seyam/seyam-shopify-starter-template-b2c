import "server-only";
import { callApi } from "@/lib/server/api/http";
import { collectionTag, TAGS } from "@/lib/server/cache/tags";
import type { CollectionWithProducts } from "../_types";

type ProductFilter =
  | { available: boolean }
  | { price: { min?: number; max?: number } };

/**
 * Server-side client for the collection-detail endpoint. Shopify + GraphQL live
 * behind /api/collection/get-collection. `filters` is JSON-encoded because it's
 * an array of objects.
 */
export async function getCollection(
  handle: string,
  locale: string,
  {
    first = 24,
    sortKey = "BEST_SELLING",
    reverse = false,
    filters,
  }: {
    first?: number;
    sortKey?: "BEST_SELLING" | "CREATED" | "PRICE" | "TITLE";
    reverse?: boolean;
    filters?: ProductFilter[];
  } = {},
): Promise<CollectionWithProducts | null> {
  return callApi<CollectionWithProducts | null>(
    "/api/collection/get-collection",
    {
      searchParams: {
        handle,
        locale,
        first,
        sortKey,
        reverse,
        filters: filters ? JSON.stringify(filters) : undefined,
      },
      tags: [TAGS.collections, collectionTag(handle), TAGS.products],
      revalidate: 60 * 60 * 24,
    },
  );
}
