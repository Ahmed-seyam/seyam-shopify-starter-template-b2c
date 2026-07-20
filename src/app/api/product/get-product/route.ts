import { ok, route } from "@/lib/server/api/route";
import { productTag, TAGS } from "@/lib/server/cache/tags";
import { reshapeProduct, type RawProduct } from "@/lib/server/products/reshape";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { GET_PRODUCT_QUERY } from "./query";

/**
 * GET /api/product/get-product?handle=&locale=
 *
 * The single egress point for a single product. `storefrontFetch` (and thus the
 * Storefront token) lives only behind this handler — pages/actions reach it via
 * `getProduct` (lib/products), which calls this over HTTP.
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") ?? "";
  const locale = searchParams.get("locale") ?? undefined;

  const data = await storefrontFetch<{ product: RawProduct | null }>(
    GET_PRODUCT_QUERY,
    {
      variables: { handle },
      locale,
      tags: [TAGS.products, productTag(handle)],
    },
  );

  return ok(data.product ? reshapeProduct(data.product) : null);
});
