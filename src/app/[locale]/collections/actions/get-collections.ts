import "server-only";
import { TAGS } from "@/app/core/cache/tags";
import { storefrontFetch } from "@/app/core/shopify/client";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/app/core/shopify/types";
import { GET_COLLECTIONS_QUERY } from "../queries/get-collections";
import type { Collection } from "../types";

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
};

export async function getCollections(
  locale: string,
  { first = 12 }: { first?: number } = {},
): Promise<Collection[]> {
  const data = await storefrontFetch<{
    collections: Connection<RawCollection>;
  }>(GET_COLLECTIONS_QUERY, {
    variables: { first },
    locale,
    tags: [TAGS.collections],
  });

  return flattenConnection(data.collections);
}
