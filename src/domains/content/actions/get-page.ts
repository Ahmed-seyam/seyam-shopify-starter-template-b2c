import "server-only";
import { pageTag, TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import { GET_PAGE_QUERY } from "../queries/get-page";
import type { Page } from "../types";

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
