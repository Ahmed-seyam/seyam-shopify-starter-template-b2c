import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";
import { z } from "zod";
import { env } from "@/core/config/env";

export const dynamic = "force-dynamic";

const bodySchema = z.object({
  tags: z.array(z.string()).optional(),
  paths: z.array(z.string()).optional(),
});

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

  const authorization = request.headers.get("authorization");
  if (authorization !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { tags = [], paths = [] } = parsed.data;
  // 'max' = serve stale while fresh content regenerates in the background.
  for (const tag of tags) revalidateTag(tag, "max");
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({ ok: true, tags, paths });
}
