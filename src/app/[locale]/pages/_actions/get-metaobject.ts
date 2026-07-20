import "server-only";
import { callApi } from "@/lib/server/api/http";
import { metaobjectTag, TAGS } from "@/lib/server/cache/tags";
import type { Metaobject } from "../_types";

/**
 * Server-side client for the metaobject endpoint (/api/page/get-metaobject).
 * Any CMS source can replace the route behind the same signature — callers only
 * ever see the Metaobject domain type.
 */
export async function getMetaobject(
  type: string,
  handle: string,
  locale: string,
): Promise<Metaobject | null> {
  return callApi<Metaobject | null>("/api/page/get-metaobject", {
    searchParams: { type, handle, locale },
    tags: [TAGS.metaobjects, metaobjectTag(handle)],
    revalidate: 60 * 60 * 24,
  });
}
