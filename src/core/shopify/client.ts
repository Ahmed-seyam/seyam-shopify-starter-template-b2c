import "server-only";
import { env } from "@/core/config/env";
import { countries, languages, parseLocale } from "@/i18n/routing";
import { persistSession, type SessionKey } from "./session";
import { toShopifyLanguage } from "./types";

// The store's supported @inContext codes (synced from Shopify via
// sync-locales). Anything outside these sets — e.g. a malformed locale from a
// bot, a stale URL, or an RSC prefetch of a redirected path — must never be
// forwarded verbatim, or Shopify 500s the request with an "invalid value"
// LanguageCode/CountryCode error. We fall back to the store defaults instead.
const KNOWN_LANGUAGES = new Set(languages.map((l) => toShopifyLanguage(l.code)));
const KNOWN_COUNTRIES = new Set(countries.map((c) => c.code.toUpperCase()));
const DEFAULT_LANGUAGE = toShopifyLanguage(languages[0].code);

export class ShopifyError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly query: string,
  ) {
    super(message);
    this.name = "ShopifyError";
  }
}

/** Business-rule rejection reported by a mutation's `userErrors`. */
export type UserError = {
  field: string[] | null;
  message: string;
  code?: string;
};

export class ShopifyUserError extends Error {
  constructor(
    public readonly operation: string,
    public readonly userErrors: UserError[],
  ) {
    super(`${operation}: ${userErrors.map((e) => e.message).join("; ")}`);
    this.name = "ShopifyUserError";
  }
}

type StorefrontFetchOptions = {
  variables?: Record<string, unknown>;
  /** Cache tags for webhook-driven invalidation (core/cache/tags). */
  tags?: string[];
  /**
   * Seconds until background revalidation. Webhooks are the primary freshness
   * mechanism; this is the safety net. Pass 0 / omit tags for uncached data.
   */
  revalidate?: number | false;
  cache?: RequestCache;
  /** App locale ("en-eg", "ar-us") — mapped to @inContext language + country. */
  locale?: string;
  /** Explicit ISO country code — overrides the locale's market. */
  country?: string;
};

/**
 * Single egress point to the Shopify Storefront API. Server-only: the token
 * never reaches the browser. Every query should declare $country/$language
 * variables with @inContext so Markets translations and pricing apply.
 */
export async function storefrontFetch<T>(
  query: string,
  {
    variables,
    tags,
    revalidate = 60 * 60 * 24,
    cache,
    locale,
    country,
  }: StorefrontFetchOptions = {},
): Promise<T> {
  const config = env();
  const endpoint = `https://${config.SHOPIFY_STORE_DOMAIN}/api/${config.SHOPIFY_API_VERSION}/graphql.json`;

  const parsed = locale ? parseLocale(locale) : undefined;

  const rawCountry = (
    country ??
    parsed?.country ??
    config.SHOPIFY_DEFAULT_COUNTRY
  ).toUpperCase();
  const rawLanguage = parsed
    ? toShopifyLanguage(parsed.language)
    : DEFAULT_LANGUAGE;

  const safeCountry = KNOWN_COUNTRIES.has(rawCountry)
    ? rawCountry
    : config.SHOPIFY_DEFAULT_COUNTRY.toUpperCase();
  const safeLanguage = KNOWN_LANGUAGES.has(rawLanguage)
    ? rawLanguage
    : DEFAULT_LANGUAGE;

  if (rawLanguage !== safeLanguage || rawCountry !== safeCountry) {
    console.warn(
      `[shopify] ignoring unsupported @inContext for locale "${locale}" ` +
        `(language ${rawLanguage} → ${safeLanguage}, country ${rawCountry} → ${safeCountry})`,
    );
  }

  const contextVariables = {
    country: safeCountry,
    language: safeLanguage,
    ...variables,
  };

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": config.SHOPIFY_STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query, variables: contextVariables }),
    ...(cache ? { cache } : {}),
    next: {
      ...(tags ? { tags } : {}),
      ...(revalidate !== undefined && cache !== "no-store"
        ? { revalidate }
        : {}),
    },
  });

  if (!response.ok) {
    throw new ShopifyError(
      `Storefront API responded with ${response.status}`,
      response.status,
      query,
    );
  }

  const body = (await response.json()) as {
    data: T;
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new ShopifyError(
      body.errors.map((error) => error.message).join("; "),
      200,
      query,
    );
  }

  return body.data;
}

type StorefrontMutationOptions<TPayload> = Omit<
  StorefrontFetchOptions,
  "tags" | "revalidate" | "cache"
> & {
  /**
   * Explicitly tolerated userErrors (e.g. removing an already-removed cart
   * line is the desired end-state). Keep predicates narrow and named at the
   * call site — a broad match here is how errors get silently swallowed.
   */
  tolerate?: (error: UserError) => boolean;
  /**
   * Session reconciliation (core/shopify/session): after a successful
   * mutation, `extract` pulls the authoritative entity id out of the payload
   * and it is persisted to the session cookie automatically — Shopify may
   * re-issue entities (a dead cart id silently becomes a NEW cart), so the
   * returned id is the truth, never the one we sent. The transport doing
   * this is what makes stale-session bugs impossible at call sites.
   */
  session?: {
    key: SessionKey;
    extract: (payload: TPayload) => string | null | undefined;
  };
};

/**
 * Single way to run Storefront MUTATIONS. Enforces the two rules every
 * mutation must follow, so call sites can't forget them:
 *
 * 1. `userErrors` always throw (ShopifyUserError) unless a narrow `tolerate`
 *    predicate opts a specific case out. Shopify reports business-rule
 *    failures as 200 + userErrors, and an unchecked one means the app
 *    continues on state that was never written.
 * 2. Never cached (`no-store`) — mutations are per-user runtime writes.
 *
 * If the mutation returns an entity id the app persists (cart cookie today,
 * customer session when domains/customer lands), the caller must store the
 * RETURNED id, not assume the one it sent — Shopify may re-issue entities
 * (see addToCart's stale-cookie self-heal for the reference pattern).
 *
 * @param operation top-level mutation field name, e.g. "cartLinesAdd"
 */
export async function storefrontMutation<TPayload extends {
  userErrors: UserError[];
}>(
  operation: string,
  query: string,
  { tolerate, session, ...options }: StorefrontMutationOptions<TPayload> = {},
): Promise<TPayload> {
  const data = await storefrontFetch<Record<string, TPayload | null>>(query, {
    ...options,
    cache: "no-store",
  });

  const payload = data[operation];
  if (!payload) {
    throw new ShopifyError(
      `Mutation ${operation} returned no payload`,
      200,
      query,
    );
  }

  const errors = tolerate
    ? payload.userErrors.filter((error) => !tolerate(error))
    : payload.userErrors;
  if (errors.length > 0) {
    throw new ShopifyUserError(operation, errors);
  }

  if (session) {
    const id = session.extract(payload);
    if (id) await persistSession(session.key, id);
  }

  return payload;
}
