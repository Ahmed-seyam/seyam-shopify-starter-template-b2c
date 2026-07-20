import "server-only";
import { callApi } from "@/lib/server/api/http";
import { TAGS } from "@/lib/server/cache/tags";
import type { Collection } from "../_types";

/**
 * Server-side client for the collections-listing endpoint
 * (/api/collection/get-collections).
 */
export async function getCollections(
  locale: string,
  { first = 12 }: { first?: number } = {},
): Promise<Collection[]> {
  return callApi<Collection[]>("/api/collection/get-collections", {
    searchParams: { locale, first },
    tags: [TAGS.collections],
    revalidate: 60 * 60 * 24,
  });
}
