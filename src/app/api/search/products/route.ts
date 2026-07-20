import { ok, route } from "@/lib/server/api/route";
import type { CatalogParams } from "@/lib/client/catalog/params";
import { shopifySearch } from "../_shopify";

type SearchBody = {
  query: string;
  locale: string;
  catalog?: CatalogParams;
};

/**
 * POST /api/search/products — full Shopify search results for the /search page
 * (shopify provider). Reached via searchProducts (search/_actions). Algolia
 * mode renders client-side InstantSearch instead and never hits this route.
 */
export const POST = route(async (request) => {
  const { query, locale, catalog } = (await request.json()) as SearchBody;
  const products = await shopifySearch(query, { locale, catalog });
  return ok(products);
});
