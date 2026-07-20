import { NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import { checkRateLimit, clientIp } from "@/plugins/server/security/rate-limit";

/**
 * Server relay for Algolia Insights events (click/conversion/view analytics
 * from the search UI). Keeps the Algolia key off the client; validates and
 * bounds everything before forwarding to insights.algolia.io.
 */

const RATE = { limit: 30, windowMs: 30_000 };
const EVENT_TYPES = new Set(["click", "conversion", "view"]);

type RawEvent = Record<string, unknown>;

function sanitizeEvent(raw: RawEvent, index: string): RawEvent | null {
  if (!EVENT_TYPES.has(String(raw.eventType))) return null;
  if (typeof raw.eventName !== "string" || raw.eventName.length > 64)
    return null;
  const objectIDs = Array.isArray(raw.objectIDs)
    ? raw.objectIDs.filter(
        (id) => typeof id === "string" && id.length <= 256,
      )
    : [];
  if (objectIDs.length === 0 || objectIDs.length > 20) return null;

  return {
    eventType: raw.eventType,
    eventName: raw.eventName,
    index,
    objectIDs,
    userToken:
      typeof raw.userToken === "string" && raw.userToken.length <= 128
        ? raw.userToken
        : "anon",
    ...(typeof raw.queryID === "string" && raw.queryID.length <= 64
      ? { queryID: raw.queryID }
      : {}),
    ...(Array.isArray(raw.positions) &&
    raw.positions.every((p) => typeof p === "number")
      ? { positions: raw.positions }
      : {}),
  };
}

export async function POST(request: NextRequest) {
  const secFetchSite = request.headers.get("sec-fetch-site");
  if (secFetchSite && secFetchSite !== "same-origin") {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const rate = checkRateLimit(`insights:${clientIp(request.headers)}`, RATE);
  if (!rate.ok) {
    return NextResponse.json(
      { error: "rate_limited" },
      { status: 429, headers: { "Retry-After": String(rate.retryAfter) } },
    );
  }

  const config = env();
  if (!config.ALGOLIA_APP_ID || !config.ALGOLIA_SEARCH_API_KEY) {
    return NextResponse.json({ status: "skipped" });
  }

  let events: RawEvent[];
  try {
    const body = (await request.json()) as { events?: RawEvent[] };
    if (!Array.isArray(body.events) || body.events.length > 20) {
      return NextResponse.json({ error: "bad_request" }, { status: 400 });
    }
    events = body.events;
  } catch {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  const sanitized = events
    .map((event) => sanitizeEvent(event, config.ALGOLIA_INDEX))
    .filter((event): event is RawEvent => event !== null);
  if (sanitized.length === 0) {
    return NextResponse.json({ status: "skipped" });
  }

  const response = await fetch("https://insights.algolia.io/1/events", {
    method: "POST",
    headers: {
      "X-Algolia-Application-Id": config.ALGOLIA_APP_ID,
      "X-Algolia-API-Key": config.ALGOLIA_SEARCH_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ events: sanitized }),
    cache: "no-store",
  });

  return NextResponse.json(
    { status: response.ok ? "ok" : "upstream_error" },
    { status: response.ok ? 200 : 502 },
  );
}
