import { ok, route } from "@/lib/server/api/route";
import { TAGS } from "@/lib/server/cache/tags";
import { reshapeProductCard, type RawProductCard } from "@/lib/server/products/reshape";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { flattenConnection, type Connection } from "@/types/shopify";
import { GET_PRODUCTS_QUERY } from "./query";

const SORT_KEYS = [
  "TITLE",
  "PRICE",
  "BEST_SELLING",
  "CREATED_AT",
  "RELEVANCE",
] as const;

type SortKey = (typeof SORT_KEYS)[number];

function parseSortKey(value: string | null): SortKey | undefined {
  return SORT_KEYS.find((key) => key === value);
}

/**
 * GET /api/product/get-products?first=&query=&sortKey=&reverse=&locale=
 *
 * Product listing egress. Reached via `getProducts` (lib/products).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const first = Number(searchParams.get("first") ?? 12);
  const query = searchParams.get("query") ?? undefined;
  const sortKey = parseSortKey(searchParams.get("sortKey"));
  const reverseParam = searchParams.get("reverse");
  const reverse = reverseParam === null ? undefined : reverseParam === "true";
  const locale = searchParams.get("locale") ?? undefined;

  const data = await storefrontFetch<{
    products: Connection<RawProductCard>;
  }>(GET_PRODUCTS_QUERY, {
    variables: { first, query, sortKey, reverse },
    locale,
    tags: [TAGS.products],
  });

  return ok(flattenConnection(data.products).map(reshapeProductCard));
});
