import "server-only";
import { revalidateTag } from "next/cache";
import {
  collectionTag,
  metaobjectTag,
  pageTag,
  productTag,
  TAGS,
} from "./tags";

type WebhookPayload = {
  handle?: string;
  [key: string]: unknown;
};

/**
 * Maps a Shopify webhook topic to the cache tags it invalidates.
 * Returns the tags that were revalidated (for logging), or null when the
 * topic is not cache-relevant (e.g. inventory — that data is never in the
 * static cache; it renders per-request).
 */
export function invalidateForTopic(
  topic: string,
  payload: WebhookPayload,
): string[] | null {
  const tags = tagsForTopic(topic, payload);
  if (!tags) return null;

  for (const tag of tags) {
    // 'max' = stale-while-revalidate: keep serving the old page while the
    // fresh one renders in the background.
    revalidateTag(tag, "max");
  }
  return tags;
}

function tagsForTopic(
  topic: string,
  payload: WebhookPayload,
): string[] | null {
  switch (topic) {
    case "products/create":
    case "products/delete":
      return [TAGS.products];
    case "products/update":
      // A price/title change affects the PDP and every listing that shows it.
      return payload.handle
        ? [TAGS.products, productTag(payload.handle)]
        : [TAGS.products];
    case "collections/create":
    case "collections/delete":
      return [TAGS.collections];
    case "collections/update":
      return payload.handle
        ? [TAGS.collections, collectionTag(payload.handle)]
        : [TAGS.collections];
    case "pages/create":
    case "pages/delete":
      return [TAGS.pages];
    case "pages/update":
      return payload.handle
        ? [TAGS.pages, pageTag(payload.handle)]
        : [TAGS.pages];
    case "metaobjects/create":
    case "metaobjects/delete":
      return [TAGS.metaobjects];
    case "metaobjects/update":
      return payload.handle
        ? [TAGS.metaobjects, metaobjectTag(payload.handle)]
        : [TAGS.metaobjects];
    default:
      return null;
  }
}
