import "server-only";
import { productTag, TAGS } from "@/lib/cache/tags";
import { storefrontFetch } from "@/lib/shopify/client";
import { GET_PRODUCT_QUERY } from "../_queries/get-product";
import type { Product } from "../_types";
import { reshapeProduct, type RawProduct } from "./reshape";

export async function getProduct(
  handle: string,
  locale: string,
): Promise<Product | null> {
  const data = await storefrontFetch<{ product: RawProduct | null }>(
    GET_PRODUCT_QUERY,
    {
      variables: { handle },
      locale,
      tags: [TAGS.products, productTag(handle)],
    },
  );

  return data.product ? reshapeProduct(data.product) : null;
}
