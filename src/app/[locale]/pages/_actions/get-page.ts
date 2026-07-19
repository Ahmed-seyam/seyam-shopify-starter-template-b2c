import "server-only";
import { pageTag, TAGS } from "@/lib/cache/tags";
import { storefrontFetch } from "@/lib/shopify/client";
import { GET_PAGE_QUERY } from "../_queries/get-page";
import type { Page } from "../_types";

export async function getPage(
  handle: string,
  locale: string,
): Promise<Page | null> {
  const data = await storefrontFetch<{ page: Page | null }>(GET_PAGE_QUERY, {
    variables: { handle },
    locale,
    tags: [TAGS.pages, pageTag(handle)],
  });

  return data.page;
}
