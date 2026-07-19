import "server-only";
import { env } from "@/lib/config/env";
import { ShopifyError } from "./client";

/**
 * Admin API client — used by scripts/seed.ts, webhook registration and the
 * Algolia indexing pipeline. Requires SHOPIFY_ADMIN_TOKEN. Never cached.
 */
export async function adminFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = env();
  if (!config.SHOPIFY_ADMIN_TOKEN) {
    throw new Error("SHOPIFY_ADMIN_TOKEN is not configured");
  }

  const endpoint = `https://${config.SHOPIFY_STORE_DOMAIN}/admin/api/${config.SHOPIFY_API_VERSION}/graphql.json`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": config.SHOPIFY_ADMIN_TOKEN,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new ShopifyError(
      `Admin API responded with ${response.status}`,
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
