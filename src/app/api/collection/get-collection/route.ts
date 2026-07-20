import { ok, route } from "@/lib/server/api/route";
import { collectionTag, TAGS } from "@/lib/server/cache/tags";
import { reshapeProductCard, type RawProductCard } from "@/lib/server/products";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/types/shopify";
import { GET_COLLECTION_QUERY } from "./query";

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

/**
 * GET /api/collection/get-collection?handle=&locale=&first=&sortKey=&reverse=&filters=
 *
 * `filters` is a JSON-encoded ProductFilter[] (objects can't ride a query
 * string flat). Reached via getCollection (collections/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") ?? "";
  const locale = searchParams.get("locale") ?? undefined;
  const first = Number(searchParams.get("first") ?? 24);
  const sortKey = searchParams.get("sortKey") ?? "BEST_SELLING";
  const reverse = searchParams.get("reverse") === "true";
  const filtersRaw = searchParams.get("filters");
  const filters = filtersRaw
    ? (JSON.parse(filtersRaw) as ProductFilter[])
    : undefined;

  const data = await storefrontFetch<{ collection: RawCollection | null }>(
    GET_COLLECTION_QUERY,
    {
      variables: { handle, first, sortKey, reverse, filters },
      locale,
      // Products shown inside a collection change when products change too.
      tags: [TAGS.collections, collectionTag(handle), TAGS.products],
    },
  );

  if (!data.collection) return ok(null);

  return ok({
    id: data.collection.id,
    handle: data.collection.handle,
    title: data.collection.title,
    description: data.collection.description,
    image: data.collection.image,
    seo: data.collection.seo,
    products: flattenConnection(data.collection.products).map(
      reshapeProductCard,
    ),
  });
});
