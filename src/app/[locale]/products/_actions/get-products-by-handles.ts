import "server-only";
import { callApi } from "@/lib/server/api/http";
import { TAGS } from "@/lib/server/cache/tags";
import type { ProductCard } from "@/types/product";

/**
 * Server-side client for the handle-resolver endpoint
 * (`/api/product/get-products-by-handles`). Returns cards in the given handle
 * order; unknown handles drop out.
 */
export async function getProductsByHandles(
  handles: string[],
  locale: string,
): Promise<ProductCard[]> {
  if (handles.length === 0) return [];
  return callApi<ProductCard[]>("/api/product/get-products-by-handles", {
    searchParams: { handles: handles.join(","), locale },
    tags: [TAGS.products],
    revalidate: 60 * 60 * 24,
  });
}
