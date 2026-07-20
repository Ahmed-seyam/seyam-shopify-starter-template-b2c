import "server-only";
import { callApi } from "@/lib/server/api/http";
import { pageTag, TAGS } from "@/lib/server/cache/tags";
import type { Page } from "../_types";

/**
 * Server-side client for the page-content endpoint (/api/page/get-page).
 * Shopify + GraphQL live behind the route.
 */
export async function getPage(
  handle: string,
  locale: string,
): Promise<Page | null> {
  return callApi<Page | null>("/api/page/get-page", {
    searchParams: { handle, locale },
    tags: [TAGS.pages, pageTag(handle)],
    revalidate: 60 * 60 * 24,
  });
}
