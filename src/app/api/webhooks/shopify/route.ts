import { NextResponse } from "next/server";
import { env } from "@/core/config/env";
import { invalidateForTopic } from "@/core/cache/invalidation";
import { verifyWebhookHmac } from "@/core/security/webhook-hmac";
import { syncSearchIndex } from "@/domains/search-algolia";

export const dynamic = "force-dynamic";

// Idempotency: Shopify retries webhooks; skip IDs we've already processed.
// In-memory is fine per instance — reprocessing an invalidation is harmless,
// this only avoids wasted work. Swap for Redis when scaling horizontally.
const seenWebhookIds = new Map<string, number>();
const SEEN_TTL_MS = 5 * 60 * 1000;

function alreadySeen(id: string | null): boolean {
  if (!id) return false;
  const now = Date.now();
  for (const [key, timestamp] of seenWebhookIds) {
    if (now - timestamp > SEEN_TTL_MS) seenWebhookIds.delete(key);
  }
  if (seenWebhookIds.has(id)) return true;
  seenWebhookIds.set(id, now);
  return false;
}

export async function POST(request: Request) {
  const secret = env().SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    console.error("[webhooks] SHOPIFY_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }

  // HMAC must be verified against the RAW body, before parsing.
  const rawBody = await request.text();
  const hmac = request.headers.get("x-shopify-hmac-sha256");

  if (!verifyWebhookHmac(rawBody, hmac, secret)) {
    console.warn("[webhooks] HMAC verification failed");
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const topic = request.headers.get("x-shopify-topic") ?? "";
  const webhookId = request.headers.get("x-shopify-webhook-id");

  if (alreadySeen(webhookId)) {
    return NextResponse.json({ ok: true, deduped: true });
  }

  let payload: { handle?: string };
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tags = invalidateForTopic(topic, payload);

  // Same pipeline keeps the Algolia index in sync (no-op unless enabled).
  // Failures are logged, not fatal — Shopify must get a fast 200 or it
  // retries and eventually deletes the subscription.
  try {
    await syncSearchIndex(topic, payload);
  } catch (error) {
    console.error("[webhooks] search index sync failed", error);
  }

  console.info(`[webhooks] ${topic}`, { tags });
  return NextResponse.json({ ok: true, tags });
}
