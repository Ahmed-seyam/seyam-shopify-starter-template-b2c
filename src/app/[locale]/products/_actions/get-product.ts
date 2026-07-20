import "server-only";
import { callApi } from "@/lib/server/api/http";
import { productTag, TAGS } from "@/lib/server/cache/tags";
import type { Product } from "@/types/product";

/**
 * Server-side client for the product-detail endpoint. Shopify is never touched
 * here — the query + token live behind `/api/product/get-product`. Cache tags
 * are carried on the outer fetch too so a webhook `revalidateTag` clears both
 * this response and the handler's Storefront fetch.
 */
export async function getProduct(
  handle: string,
  locale: string,
): Promise<Product | null> {
  return callApi<Product | null>("/api/product/get-product", {
    searchParams: { handle, locale },
    tags: [TAGS.products, productTag(handle)],
    revalidate: 60 * 60 * 24,
  });
}
