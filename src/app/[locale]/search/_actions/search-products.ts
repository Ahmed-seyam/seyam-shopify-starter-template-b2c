import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { CatalogParams } from "@/lib/client/catalog/params";
import type { ProductCard } from "@/types/product";

/**
 * Server-side client for full Shopify search results (/api/search/products).
 * Used by the /search page in shopify-provider mode. Never cached — results
 * change constantly.
 */
export async function searchProducts(
  query: string,
  locale: string,
  catalog?: CatalogParams,
): Promise<ProductCard[]> {
  return callApi<ProductCard[]>("/api/search/products", {
    method: "POST",
    body: { query, locale, catalog },
  });
}
