import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { algoliaSearchProvider } from "@/plugins/server/algolia/adapter";
import { checkRateLimit, clientIp } from "@/plugins/server/security/rate-limit";
import { shopifySuggest } from "./_shopify";

/**
 * Live search suggestions for the header popup.
 *
 * Bot hardening, cheapest check first:
 * 1. Same-origin only — browsers send Sec-Fetch-Site on fetch(); anything
 *    cross-site (or a Referer from another host) is rejected outright.
 * 2. Query validation — bounds on length and limit stop abuse of the
 *    upstream search provider (Algolia bills per operation).
 * 3. Per-IP rate limit — 30 requests per 30s window, then 429 + Retry-After.
 */

const MAX_QUERY_LENGTH = 100;
const MAX_LIMIT = 10;
const RATE = { limit: 30, windowMs: 30_000 };

export async function GET(request: NextRequest) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const referer = request.headers.get("referer");
  if (referer && new URL(referer).host !== request.nextUrl.host) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const query = request.nextUrl.searchParams.get("q")?.trim() ?? "";
  if (query.length < 2 || query.length > MAX_QUERY_LENGTH) {
    return NextResponse.json({ products: [] });
  }
  const limit = Math.min(
    Number(request.nextUrl.searchParams.get("limit")) || 4,
    MAX_LIMIT,
  );
  const locale = request.nextUrl.searchParams.get("locale") ?? "en";

  const rate = checkRateLimit(`search:${clientIp(request.headers)}`, RATE);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      {
        status: 429,
        headers: { "Retry-After": String(rate.retryAfter) },
      },
    );
  }

  try {
    // Suggest is served by the active backend: Algolia hits Algolia directly,
    // Shopify goes through the Storefront egress helper — both server-side,
    // both inside this Route Handler.
    const products =
      env().SEARCH_PROVIDER === "algolia"
        ? await algoliaSearchProvider.suggest(query, { locale, limit })
        : await shopifySuggest(query, { locale, limit });
    return NextResponse.json(
      { products },
      // Same query within a minute is served by the CDN — bots hammering a
      // fixed query never reach the search provider.
      { headers: { "Cache-Control": "public, s-maxage=60, max-age=30" } },
    );
  } catch {
    // Suggestions are best-effort — a misconfigured store must not break
    // the header.
    return NextResponse.json({ products: [] });
  }
}
