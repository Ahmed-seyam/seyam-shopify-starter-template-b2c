import { ok, route } from "@/lib/server/api/route";
import { TAGS } from "@/lib/server/cache/tags";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/types/shopify";
import { GET_COLLECTIONS_QUERY } from "./query";

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
};

/**
 * GET /api/collection/get-collections?locale=&first=
 * Reached via getCollections (collections/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? undefined;
  const first = Number(searchParams.get("first") ?? 12);

  const data = await storefrontFetch<{
    collections: Connection<RawCollection>;
  }>(GET_COLLECTIONS_QUERY, {
    variables: { first },
    locale,
    tags: [TAGS.collections],
  });

  return ok(flattenConnection(data.collections));
});
