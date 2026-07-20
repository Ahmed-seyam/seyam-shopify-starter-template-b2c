import { timingSafeEqual } from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { env } from "@/config/env";
import { readJson } from "@/app/api/_utils";
import { revalidateSchema } from "@/validation/system";

/** Constant-time bearer-token check — avoids leaking the secret via timing. */
function bearerMatches(authorization: string | null, secret: string): boolean {
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(authorization ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export const dynamic = "force-dynamic";

/**
 * Manual revalidation escape hatch for missed webhooks.
 *
 *   curl -X POST $SITE_URL/api/revalidate \
 *     -H "Authorization: Bearer $REVALIDATION_SECRET" \
 *     -H "Content-Type: application/json" \
 *     -d '{"tags":["products"]}'
 */
export async function POST(request: Request) {
  const secret = env().REVALIDATION_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  if (!bearerMatches(request.headers.get("authorization"), secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = revalidateSchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { tags = [], paths = [] } = parsed.data;
  // 'max' = serve stale while fresh content regenerates in the background.
  for (const tag of tags) revalidateTag(tag, "max");
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, tags, paths });
}
