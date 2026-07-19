/**
 * Algolia Insights without a browser-side API key. This exposes an
 * `aa()`-compatible function (the search-insights call signature, which
 * InstantSearch's insights middleware drives) whose event methods POST to
 * /api/search/events — the server forwards them to insights.algolia.io with
 * the server-held key. Click/conversion analytics keep working while the
 * "no Algolia credentials in the browser" rule holds.
 */

const TOKEN_STORAGE_KEY = "algolia_user_token";

type EventPayload = Record<string, unknown>;
type TokenCallback = (token: string) => void;

const EVENT_TYPES: Record<string, "click" | "conversion" | "view"> = {
  clickedObjectIDs: "click",
  clickedObjectIDsAfterSearch: "click",
  clickedFilters: "click",
  convertedObjectIDs: "conversion",
  convertedObjectIDsAfterSearch: "conversion",
  convertedFilters: "conversion",
  viewedObjectIDs: "view",
  viewedFilters: "view",
};

function getOrCreateUserToken(): string {
  try {
    let token = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!token) {
      token = `anon-${crypto.randomUUID()}`;
      localStorage.setItem(TOKEN_STORAGE_KEY, token);
    }
    return token;
  } catch {
    return "anon";
  }
}

let userToken = "";
const tokenListeners: TokenCallback[] = [];

function sendEvents(method: string, payloads: EventPayload[]): void {
  const eventType = EVENT_TYPES[method];
  if (!eventType) return;

  const events = payloads.map((payload) => ({
    eventType,
    userToken,
    ...payload,
  }));

  // sendBeacon-style fire-and-forget; failures are irrelevant to UX.
  fetch("/api/search/events", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ events }),
    keepalive: true,
  }).catch(() => {});
}

/** search-insights–compatible entry point (subset InstantSearch uses). */
function aa(method: string, ...args: unknown[]): unknown {
  if (typeof window === "undefined") return undefined;
  if (!userToken) userToken = getOrCreateUserToken();

  switch (method) {
    case "init":
    case "addAlgoliaAgent":
      return undefined;
    case "setUserToken":
      userToken = String(args[0]);
      for (const listener of tokenListeners) listener(userToken);
      return undefined;
    case "getUserToken": {
      const callback = args[1] as
        | ((error: unknown, token: string) => void)
        | undefined;
      callback?.(null, userToken);
      return userToken;
    }
    case "onUserTokenChange": {
      const callback = args[0] as TokenCallback | undefined;
      const options = args[1] as { immediate?: boolean } | undefined;
      if (callback) {
        tokenListeners.push(callback);
        if (options?.immediate) callback(userToken);
      }
      return undefined;
    }
    case "onAuthenticatedUserTokenChange":
      (args[0] as ((token?: string) => void) | undefined)?.(undefined);
      return undefined;
    default:
      sendEvents(
        method,
        args.filter((arg): arg is EventPayload => typeof arg === "object" && arg !== null),
      );
      return undefined;
  }
}

// The insights middleware sniffs a version to decide feature support.
aa.version = "2.17.2";

/**
 * queryID memory — Algolia attributes a conversion to a search only when the
 * event carries the queryID of the search that surfaced the product. Hit
 * clicks record it here (per objectID, capped); the add-to-cart conversion
 * looks it up later, surviving the PDP navigation via sessionStorage.
 */
const QUERY_IDS_KEY = "algolia_query_ids";
const QUERY_IDS_MAX = 50;

export function rememberQueryId(objectID: string, queryID?: string): void {
  if (!queryID) return;
  try {
    const map = JSON.parse(
      sessionStorage.getItem(QUERY_IDS_KEY) ?? "{}",
    ) as Record<string, string>;
    map[objectID] = queryID;
    const keys = Object.keys(map);
    if (keys.length > QUERY_IDS_MAX) delete map[keys[0]];
    sessionStorage.setItem(QUERY_IDS_KEY, JSON.stringify(map));
  } catch {
    // Attribution is best-effort.
  }
}

/** Send a conversion (add-to-cart etc.), search-attributed when possible. */
export function insightsConversion(
  objectID: string,
  eventName = "Added To Cart",
): void {
  if (typeof window === "undefined") return;
  let queryID: string | undefined;
  try {
    const map = JSON.parse(
      sessionStorage.getItem(QUERY_IDS_KEY) ?? "{}",
    ) as Record<string, string>;
    queryID = map[objectID];
  } catch {
    // fall through — send unattributed conversion
  }
  aa(
    queryID ? "convertedObjectIDsAfterSearch" : "convertedObjectIDs",
    { eventName, objectIDs: [objectID], ...(queryID ? { queryID } : {}) },
  );
}

export const insightsClient = aa as unknown as import("instantsearch.js").InsightsClient;
