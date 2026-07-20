import type { Page } from "@/app/[locale]/pages/_types";
import { ok, route } from "@/lib/server/api/route";
import { pageTag, TAGS } from "@/lib/server/cache/tags";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { GET_PAGE_QUERY } from "./query";

/**
 * GET /api/page/get-page?handle=&locale=
 * Reached via getPage (pages/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") ?? "";
  const locale = searchParams.get("locale") ?? undefined;

  const data = await storefrontFetch<{ page: Page | null }>(GET_PAGE_QUERY, {
    variables: { handle },
    locale,
    tags: [TAGS.pages, pageTag(handle)],
  });

  return ok(data.page);
});
