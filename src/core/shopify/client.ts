import "server-only";
import { env } from "@/core/config/env";
import { LOCALE_TO_LANGUAGE } from "./types";

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
  /** App locale (en/ar) — mapped to @inContext language. */
  locale?: string;
  /** ISO country code for @inContext pricing/currency. */
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

  const contextVariables = {
    country: country ?? config.SHOPIFY_DEFAULT_COUNTRY,
    language: locale ? (LOCALE_TO_LANGUAGE[locale] ?? "EN") : "EN",
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
