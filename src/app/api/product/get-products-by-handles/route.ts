import { ok, route } from "@/lib/server/api/route";
import { TAGS } from "@/lib/server/cache/tags";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/lib/server/products/reshape";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { buildProductsByHandlesQuery } from "./query";

const HANDLE_RE = /^[\w-]+$/;
const MAX_HANDLES = 24;

/**
 * GET /api/product/get-products-by-handles?handles=a,b,c&locale=
 *
 * Resolves a set of product handles to card data, preserving request order and
 * dropping unknown handles. Backs the wishlist, whose handles live in the
 * browser. Reached via `getProductsByHandles` (products/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? undefined;

  const handles = [
    ...new Set(
      (searchParams.get("handles") ?? "")
        .split(",")
        .filter((handle) => HANDLE_RE.test(handle)),
    ),
  ].slice(0, MAX_HANDLES);

  if (handles.length === 0) return ok([]);

  const data = await storefrontFetch<Record<string, RawProductCard | null>>(
    buildProductsByHandlesQuery(handles),
    { locale, tags: [TAGS.products] },
  );

  const cards = handles
    .map((_, i) => data[`p${i}`])
    .filter((node): node is RawProductCard => node != null)
    .map(reshapeProductCard);

  return ok(cards);
});
