import "server-only";
import { env } from "@/config/env";
import type { CatalogParams } from "@/lib/client/catalog/params";
import type { ProductCard } from "@/types/product";
import type { SearchOptions, SearchProvider } from "@/types/search";
import { algoliaSort, catalogQuery, replicaIndexFor } from "@/plugins/client/algolia/builder";

/**
 * Algolia adapter using the plain REST API — no SDK dependency.
 * Records are indexed by the webhook pipeline (see ./indexing.ts) with the
 * shape of ProductCard plus objectID = product handle and a numeric `price`.
 * Catalog filters/sort are mapped by ./builder.ts.
 */

type AlgoliaConfig = ReturnType<typeof env>;
type AlgoliaHit = ProductCard & { objectID: string; price?: number };

function stripInternal(hits: AlgoliaHit[]): ProductCard[] {
  return hits.map(({ objectID: _objectID, price: _price, ...product }) => product);
}

async function fetchIndex(
  config: AlgoliaConfig,
  indexName: string,
  body: Record<string, unknown>,
): Promise<Response> {
  return fetch(
    `https://${config.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${indexName}/query`,
    {
      method: "POST",
      headers: {
        "X-Algolia-Application-Id": config.ALGOLIA_APP_ID!,
        "X-Algolia-API-Key": config.ALGOLIA_SEARCH_API_KEY!,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      cache: "no-store",
    },
  );
}

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

  const sort = catalog?.sort;
  const body = { query, hitsPerPage, ...catalogQuery(catalog).build() };
  const replica = replicaIndexFor(config.ALGOLIA_INDEX, sort);

  // Sorted queries target a replica so the ordering is correct across the whole
  // result set, not just the fetched page. Relevance/no sort uses the primary.
  const response = await fetchIndex(config, replica ?? config.ALGOLIA_INDEX, body);

  // A missing replica (404) shouldn't break search: fall back to the primary
  // index and sort the page in memory, warning so the replica gets created.
  if (replica && response.status === 404) {
    console.warn(
      `[search] Algolia replica "${replica}" not found; falling back to in-memory ` +
        `page sort. Create the replica for correct sorting across all results.`,
    );
    const fallback = await fetchIndex(config, config.ALGOLIA_INDEX, body);
    if (!fallback.ok) {
      throw new Error(`Algolia query failed with ${fallback.status}`);
    }
    const { hits } = (await fallback.json()) as { hits: AlgoliaHit[] };
    return algoliaSort(stripInternal(hits), sort);
  }

  if (!response.ok) {
    throw new Error(`Algolia query failed with ${response.status}`);
  }

  const { hits } = (await response.json()) as { hits: AlgoliaHit[] };
  // Replica already ordered the results; primary-index hits stay relevance-ranked.
  return stripInternal(hits);
}

export const algoliaSearchProvider: SearchProvider = {
  search(query: string, { limit = 24, catalog }: SearchOptions) {
    return queryIndex(query, limit, catalog);
  },
  suggest(query: string, { limit = 6 }: SearchOptions) {
    return queryIndex(query, limit);
  },
};
