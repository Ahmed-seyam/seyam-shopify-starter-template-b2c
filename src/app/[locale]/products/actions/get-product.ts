import "server-only";
import { productTag, TAGS } from "@/app/core/cache/tags";
import { storefrontFetch } from "@/app/core/shopify/client";
import { GET_PRODUCT_QUERY } from "../queries/get-product";
import type { Product } from "../types";
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
