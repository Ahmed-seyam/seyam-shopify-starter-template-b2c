import "server-only";
import { cookies } from "next/headers";

/**
 * Central session store — the ONLY place that reads/writes session cookies
 * (equivalent of PetsEgypt's apolloClient.ts middleware, adapted to Next).
 *
 * The Storefront API is stateless: unlike Odoo there is no Set-Cookie to
 * capture. The session is whatever entity ids Shopify returns in mutation
 * payloads (cart id today, customer session when domains/customer lands).
 * `storefrontMutation` reconciles them back here automatically via its
 * `session` option — domain code never touches `cookies()` directly.
 */

type SessionEntry = {
  cookie: string;
  /** Seconds — align with the upstream entity's lifetime. */
  maxAge: number;
};

export const SESSION = {
  /** Shopify carts live ~10 days; keep the cookie in that window. */
  cart: { cookie: "cartId", maxAge: 60 * 60 * 24 * 10 },
  /**
   * Customer Account API tokens, encrypted as a JWE (core/shopify/
   * customer-auth). Refresh tokens rotate on use — persist-what-returned.
   */
  customer: { cookie: "customerSession", maxAge: 60 * 60 * 24 * 30 },
} as const satisfies Record<string, SessionEntry>;

export type SessionKey = keyof typeof SESSION;

export async function getSession(key: SessionKey): Promise<string | undefined> {
  return (await cookies()).get(SESSION[key].cookie)?.value;
}

/**
 * Persist the authoritative value the API returned. Idempotent (no write
 * when unchanged) and safe everywhere: during RSC render cookie writes are
 * forbidden (Next's equivalent of PetsEgypt's `headersSent` guard) — we
 * swallow that and let the next Server Action persist it.
 */
export async function persistSession(
  key: SessionKey,
  value: string,
): Promise<void> {
  const store = await cookies();
  const entry = SESSION[key];
  if (store.get(entry.cookie)?.value === value) return;

  try {
    store.set(entry.cookie, value, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: entry.maxAge,
    });
  } catch {
    // Read-only cookie context (RSC render / cached scope) — skip silently.
  }
}

export async function clearSession(key: SessionKey): Promise<void> {
  try {
    (await cookies()).delete(SESSION[key].cookie);
  } catch {
    // Same read-only guard as persistSession.
  }
}
