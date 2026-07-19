"use client";

import type { SearchClient } from "instantsearch.js";

/**
 * InstantSearch client that never talks to Algolia directly — every request
 * is proxied through our /api/search/query route, so the API key stays on
 * the server and the route's same-origin + rate-limit protection applies.
 * A short client-side cache absorbs repeated UI states (back/forward,
 * re-opened filters) without re-fetching.
 */

const cache = new Map<string, { data: unknown; at: number }>();
const CACHE_TTL = 60_000;

type MultiQueryRequest = { indexName: string; params?: Record<string, unknown> };

function fallbackResult(request: MultiQueryRequest) {
  const params = request.params ?? {};
  return {
    hits: [],
    nbHits: 0,
    page: (params.page as number) ?? 0,
    nbPages: 0,
    hitsPerPage: (params.hitsPerPage as number) ?? 24,
    processingTimeMS: 0,
    query: (params.query as string) ?? "",
    params: "",
    facets: {},
    exhaustiveNbHits: true,
  };
}

export const proxySearchClient = {
  async search(requests: MultiQueryRequest[]) {
    const key = JSON.stringify(requests.map((request) => request.params));
    const cached = cache.get(key);
    if (cached && Date.now() - cached.at < CACHE_TTL) return cached.data;

    try {
      const response = await fetch("/api/search/query", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requests }),
      });
      if (!response.ok) return { results: requests.map(fallbackResult) };

      const data = (await response.json()) as { results: unknown[] };
      cache.set(key, { data, at: Date.now() });
      return data;
    } catch {
      return { results: requests.map(fallbackResult) };
    }
  },

  async searchForFacetValues() {
    return [];
  },
} as unknown as SearchClient;
