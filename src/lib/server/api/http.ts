import "server-only";
import { cookies } from "next/headers";
import { env } from "@/config/env";
import {
  ShopifyError,
  ShopifyUserError,
} from "@/plugins/server/shopify/client";
import { applySetCookies } from "./cookies";
import type { ApiEnvelope, ApiErrorBody } from "./route";

/**
 * The ONE way anything in the app reaches Shopify data: by calling our own
 * `/api/<domain>/<op>` Route Handlers. `lib/shopify/client` is imported only by
 * those handlers — no page, action, or component talks to Shopify directly.
 *
 * - Absolute URL from `SITE_URL` (server-side fetch needs one). Public reads
 *   pass no cookies, so their responses stay cacheable via `next.tags`.
 * - `auth: true` forwards the browser's cookies (cart id / customer session)
 *   and propagates any `Set-Cookie` the handler emits back to the browser.
 * - Errors are revived into the original ShopifyError / ShopifyUserError types.
 */

type Primitive = string | number | boolean | undefined | null;

type CallOptions = {
  method?: "GET" | "POST";
  body?: unknown;
  searchParams?: Record<string, Primitive>;
  /** Cache tags for webhook-driven invalidation (GET only). */
  tags?: string[];
  /** Background revalidation seconds (GET only). */
  revalidate?: number | false;
  /**
   * Forward the incoming Cookie header and propagate Set-Cookie back. Required
   * for per-user data (cart, customer) — makes the response uncacheable.
   */
  auth?: boolean;
};

function baseUrl(): string {
  return env().SITE_URL.replace(/\/+$/, "");
}

function reviveError(error: ApiErrorBody): Error {
  switch (error.kind) {
    case "user":
      return new ShopifyUserError(error.operation, error.userErrors);
    case "shopify":
      return new ShopifyError(error.message, error.status, "");
    default:
      return new Error(error.message);
  }
}

export async function callApi<T>(
  path: string,
  { method = "GET", body, searchParams, tags, revalidate, auth }: CallOptions = {},
): Promise<T> {
  const url = new URL(path, baseUrl());
  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value !== undefined && value !== null) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  const requestHeaders: Record<string, string> = {};
  if (body !== undefined) requestHeaders["Content-Type"] = "application/json";
  if (auth) {
    // Serialize from the cookie STORE (not the incoming header) so cookies
    // set earlier in this same request are forwarded — e.g. login persists the
    // customer token, then calls syncCartBuyerIdentity in the same request — and
    // in-request deletions (logout) are correctly omitted. Our cookie values
    // (cart gid, JWE) are RFC-safe unencoded, matching how Next parses them back.
    const all = (await cookies()).getAll();
    if (all.length > 0) {
      requestHeaders["cookie"] = all
        .map((cookie) => `${cookie.name}=${cookie.value}`)
        .join("; ");
    }
  }

  const isWrite = method !== "GET";
  const response = await fetch(url, {
    method,
    headers: requestHeaders,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    // Writes and per-user reads are never cached; public reads cache by tag.
    ...(isWrite || auth
      ? { cache: "no-store" as const }
      : {
          next: {
            ...(tags ? { tags } : {}),
            ...(revalidate !== undefined ? { revalidate } : {}),
          },
        }),
  });

  if (auth) await applySetCookies(response);

  const envelope = (await response.json()) as ApiEnvelope<T>;
  if ("error" in envelope) throw reviveError(envelope.error);
  return envelope.data;
}
