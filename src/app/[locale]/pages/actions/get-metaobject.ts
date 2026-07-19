import "server-only";
import { metaobjectTag, TAGS } from "@/app/core/cache/tags";
import { storefrontFetch } from "@/app/core/shopify/client";
import { GET_METAOBJECT_QUERY } from "../queries/get-metaobject";
import type { Metaobject, MetaobjectField } from "../types";

type RawMetaobject = Omit<Metaobject, "fields"> & {
  fields: MetaobjectField[];
};

/**
 * CMS slot: any content source (Sanity, …) can replace this behind the same
 * signature — callers only ever see the Metaobject domain type.
 */
export async function getMetaobject(
  type: string,
  handle: string,
  locale: string,
): Promise<Metaobject | null> {
  const data = await storefrontFetch<{ metaobject: RawMetaobject | null }>(
    GET_METAOBJECT_QUERY,
    {
      variables: { handle, type },
      locale,
      tags: [TAGS.metaobjects, metaobjectTag(handle)],
    },
  );

  if (!data.metaobject) return null;

  return {
    ...data.metaobject,
    fields: Object.fromEntries(
      data.metaobject.fields.map((field) => [field.key, field]),
    ),
  };
}
