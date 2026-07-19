import { NextRequest, NextResponse } from "next/server";
import { env } from "@/lib/config/env";
import { checkRateLimit, clientIp } from "@/lib/security/rate-limit";

/**
 * Server proxy for InstantSearch (Algolia provider). The browser never holds
 * an Algolia key — the client's requests land here, get whitelisted, and are
 * forwarded with the server-side key. Same bot hardening as /api/search:
 * same-origin only, strict param bounds, per-IP rate limit.
 */

const MAX_REQUESTS = 4;
const RATE = { limit: 60, windowMs: 30_000 };

type RawRequest = { params?: Record<string, unknown> };

/** Keep only known-safe Algolia params, with bounds. */
function sanitizeParams(params: Record<string, unknown>): Record<string, unknown> | null {
  const query = typeof params.query === "string" ? params.query : "";
  if (query.length > 200) return null;

  const strings = (value: unknown, max: number) =>
    Array.isArray(value) &&
    value.length <= max &&
    value.every(
      (entry) =>
        (typeof entry === "string" && entry.length <= 100) ||
        (Array.isArray(entry) &&
          entry.every((e) => typeof e === "string" && e.length <= 100)),
    )
      ? value
      : undefined;

  const bounded = (value: unknown, max: number) =>
    typeof value === "number" && value >= 0 && value <= max
      ? value
      : undefined;

  return {
    query,
    page: bounded(params.page, 200) ?? 0,
    hitsPerPage: bounded(params.hitsPerPage, 48) ?? 24,
    ...(strings(params.facets, 20) ? { facets: params.facets } : {}),
    ...(strings(params.facetFilters, 20)
      ? { facetFilters: params.facetFilters }
      : {}),
    ...(strings(params.numericFilters, 20)
      ? { numericFilters: params.numericFilters }
      : {}),
    ...(bounded(params.maxValuesPerFacet, 50) !== undefined
      ? { maxValuesPerFacet: params.maxValuesPerFacet }
      : {}),
    ...(typeof params.highlightPreTag === "string"
      ? { highlightPreTag: params.highlightPreTag }
      : {}),
    ...(typeof params.highlightPostTag === "string"
      ? { highlightPostTag: params.highlightPostTag }
      : {}),
  };
}

export async function POST(request: NextRequest) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rate = checkRateLimit(`search-query:${clientIp(request.headers)}`, RATE);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const config = env();
  if (!config.ALGOLIA_APP_ID || !config.ALGOLIA_SEARCH_API_KEY) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  let requests: RawRequest[];
  try {
    const body = (await request.json()) as { requests?: RawRequest[] };
    if (!Array.isArray(body.requests) || body.requests.length > MAX_REQUESTS) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    requests = body.requests;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const results = await Promise.all(
    requests.map(async (raw) => {
      const params = sanitizeParams(raw.params ?? {});
      if (!params) return { hits: [], nbHits: 0, facets: {} };

      const response = await fetch(
        `https://${config.ALGOLIA_APP_ID}-dsn.algolia.net/1/indexes/${config.ALGOLIA_INDEX}/query`,
        {
          method: "POST",
          headers: {
            "X-Algolia-Application-Id": config.ALGOLIA_APP_ID!,
            "X-Algolia-API-Key": config.ALGOLIA_SEARCH_API_KEY!,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(params),
          cache: "no-store",
        },
      );
      if (!response.ok) {
        throw new Error(`Algolia query failed with ${response.status}`);
      }
      return response.json();
    }),
  ).catch(() => null);

  if (!results) {
    return NextResponse.json({ error: "upstream_error" }, { status: 502 });
  }
  return NextResponse.json({ results });
}
