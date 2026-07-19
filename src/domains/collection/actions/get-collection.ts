import "server-only";
import { collectionTag, TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/core/shopify/types";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/domains/product/actions/reshape";
import { GET_COLLECTION_QUERY } from "../queries/get-collection";
import type { CollectionWithProducts } from "../types";

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
  products: Connection<RawProductCard>;
};

type ProductFilter =
  | { available: boolean }
  | { price: { min?: number; max?: number } };

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
  const data = await storefrontFetch<{ collection: RawCollection | null }>(
    GET_COLLECTION_QUERY,
    {
      variables: { handle, first, sortKey, reverse, filters },
      locale,
      // Products shown inside a collection change when products change too.
      tags: [TAGS.collections, collectionTag(handle), TAGS.products],
    },
  );

  if (!data.collection) return null;

  return {
    id: data.collection.id,
    handle: data.collection.handle,
    title: data.collection.title,
    description: data.collection.description,
    image: data.collection.image,
    seo: data.collection.seo,
    products: flattenConnection(data.collection.products).map(
      reshapeProductCard,
    ),
  };
}
