import "server-only";
import { env } from "@/lib/config/env";
import type { CatalogParams } from "@/components/catalog/catalog-params";
import type { ProductCard } from "@/app/[locale]/products/_types";
import type { SearchOptions, SearchProvider } from "@/app/[locale]/search/_types";
import { algoliaSort, catalogQuery } from "./builder";

/**
 * Algolia adapter using the plain REST API — no SDK dependency.
 * Records are indexed by the webhook pipeline (see ./indexing.ts) with the
 * shape of ProductCard plus objectID = product handle and a numeric `price`.
 * Catalog filters/sort are mapped by ./builder.ts.
 */

type AlgoliaHit = ProductCard & { objectID: string; price?: number };

async function queryIndex(
  query: string,
  hitsPerPage: number,
  catalog?: CatalogParams,
): Promise<ProductCard[]> {
  const config = env();
  if (!config.ALGOLIA_APP_ID || !config.ALGOLIA_SEARCH_API_KEY) {
    throw new Error(
      "SEARCH_PROVIDER=algolia requires ALGOLIA_APP_ID and ALGOLIA_SEARCH_API_KEY",
    );
  }

  const response = await fetch(
    `https://${config.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${config.ALGOLIA_INDEX}/query`,
    {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": config.ALGOLIA_APP_ID,
        "X-Algolia-API-Key": config.ALGOLIA_SEARCH_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ query, hitsPerPage, ...catalogQuery(catalog).build() }),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Algolia query failed with ${response.status}`);
  }

  const body = (await response.json()) as { hits: AlgoliaHit[] };
  const hits = body.hits.map(
    ({ objectID: _objectID, price: _price, ...product }) => product,
  );
  return algoliaSort(hits, catalog?.sort);
}

export const algoliaSearchProvider: SearchProvider = {
  search(query: string, { limit = 24, catalog }: SearchOptions) {
    return queryIndex(query, limit, catalog);
  },
  suggest(query: string, { limit = 6 }: SearchOptions) {
    return queryIndex(query, limit);
  },
};
