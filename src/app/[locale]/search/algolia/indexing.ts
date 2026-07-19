import "server-only";
import { env } from "@/app/core/config/env";
import { getProduct } from "@/app/[locale]/products";
import { routing } from "@/i18n/routing";

/**
 * Keeps the Algolia index in sync from the Shopify webhook pipeline —
 * the same handler that invalidates cache tags calls this, so cache and
 * index stay consistent by construction. No-ops unless SEARCH_PROVIDER=algolia.
 */
export async function syncSearchIndex(
  topic: string,
  payload: { handle?: string; [key: string]: unknown },
): Promise<void> {
  const config = env();
  if (config.SEARCH_PROVIDER !== "algolia") return;
  if (!config.ALGOLIA_APP_ID || !config.ALGOLIA_ADMIN_API_KEY) {
    console.warn("[search-algolia] Missing ALGOLIA_ADMIN_API_KEY — skipping sync");
    return;
  }
  if (!payload.handle) return;

  if (topic === "products/delete") {
    await writeRequest(`/${payload.handle}`, "DELETE");
    return;
  }

  if (topic === "products/create" || topic === "products/update") {
    // Index the default locale's card shape; objectID = handle.
    const product = await getProduct(payload.handle, routing.defaultLocale);
    if (!product) return;

    const { variants: _v, images: _i, descriptionHtml: _d, ...card } = product;
    await writeRequest(`/${payload.handle}`, "PUT", {
      objectID: payload.handle,
      ...card,
    });
  }
}

async function writeRequest(
  path: string,
  method: "PUT" | "DELETE",
  body?: Record<string, unknown>,
): Promise<void> {
  const config = env();
  const response = await fetch(
    `https://${config.ALGOLIA_APP_ID}.algolia.net/1/indexes/${config.ALGOLIA_INDEX}${path}`,
    {
      method,
      headers: {
        "X-Algolia-Application-Id": config.ALGOLIA_APP_ID!,
        "X-Algolia-API-Key": config.ALGOLIA_ADMIN_API_KEY!,
        "Content-Type": "application/json",
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
      cache: "no-store",
    },
  );

  if (!response.ok) {
    throw new Error(`Algolia ${method} failed with ${response.status}`);
  }
}
