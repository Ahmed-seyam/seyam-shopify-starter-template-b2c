import type { Metaobject, MetaobjectField } from "@/app/[locale]/pages/_types";
import { ok, route } from "@/lib/server/api/route";
import { metaobjectTag, TAGS } from "@/lib/server/cache/tags";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { GET_METAOBJECT_QUERY } from "./query";

type RawMetaobject = Omit<Metaobject, "fields"> & {
  fields: MetaobjectField[];
};

/**
 * GET /api/page/get-metaobject?type=&handle=&locale=
 *
 * CMS slot — reached via getMetaobject (pages/_actions). Raw `fields` array is
 * reshaped into a key→field record here so callers get the domain Metaobject.
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const handle = searchParams.get("handle") ?? "";
  const type = searchParams.get("type") ?? "";
  const locale = searchParams.get("locale") ?? undefined;

  const data = await storefrontFetch<{ metaobject: RawMetaobject | null }>(
    GET_METAOBJECT_QUERY,
    {
      variables: { handle, type },
      locale,
      tags: [TAGS.metaobjects, metaobjectTag(handle)],
    },
  );

  if (!data.metaobject) return ok(null);

  return ok({
    ...data.metaobject,
    fields: Object.fromEntries(
      data.metaobject.fields.map((field) => [field.key, field]),
    ),
  } satisfies Metaobject);
});
