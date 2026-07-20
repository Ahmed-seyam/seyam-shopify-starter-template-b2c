import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import { cookies } from "next/headers";
import { env } from "@/config/env";

/**
 * Classic Storefront API customer accounts session.
 *
 * The Storefront API returns an opaque `customerAccessToken` (+ `expiresAt`)
 * from `customerAccessTokenCreate`. We keep it in an encrypted JWE cookie —
 * the raw bearer token never sits in a readable cookie, and the JWE carries
 * its own expiry bounded to the token's lifetime.
 *
 * Cookie writes only ever happen in Server Actions / Route Handlers (login,
 * register, reset, logout). Reads (`getCustomerToken`) never write — a token
 * write during Server Component render is silently dropped by Next, so we do
 * not attempt renew-on-read. An expired token simply reads as signed-out.
 *
 * B2B fork note: this classic token CANNOT carry buyer context. Shopify's
 * `BuyerInput.customerAccessToken` for `@inContext(buyer:)` requires a
 * Customer Account API (OAuth) token, so the B2B fork replaces this module.
 */

/**
 * `__Host-` prefix (production only) pins the cookie to a secure, host-only,
 * path=/ scope — closes the subdomain cookie-injection class. The prefix is
 * rejected by browsers over plain HTTP, so dev falls back to the bare name.
 */
export const CUSTOMER_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Host-customerSession"
    : "customerSession";

/** Hard cap on the cookie/JWE lifetime, regardless of the token's expiry. */
const MAX_SESSION_SECONDS = 60 * 60 * 24 * 30;

export type CustomerToken = {
  accessToken: string;
  /** Epoch ms when the Storefront access token expires. */
  expiresAt: number;
};

/**
 * Customer accounts require a SESSION_SECRET to encrypt the cookie. Absent →
 * the feature degrades to a "not configured" notice instead of storing a
 * bearer token in the clear.
 */
export function customerAccountsEnabled(): boolean {
  return Boolean(env().SESSION_SECRET);
}

async function sessionKey(): Promise<Uint8Array> {
  const secret = env().SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return new Uint8Array(digest);
}

/**
 * Persist the access token Shopify returned. MUST run in a Server Action or
 * Route Handler — cookie writes during RSC render are dropped by Next.
 */
export async function saveCustomerToken(token: CustomerToken): Promise<void> {
  const secondsToExpiry = Math.floor((token.expiresAt - Date.now()) / 1000);
  const maxAge = Math.min(Math.max(secondsToExpiry, 0), MAX_SESSION_SECONDS);

  const jwe = await new EncryptJWT({ accessToken: token.accessToken })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime(Math.floor(Date.now() / 1000) + maxAge)
    .encrypt(await sessionKey());

  (await cookies()).set(CUSTOMER_COOKIE, jwe, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge,
  });
}

/**
 * Read the current access token, or null when signed out / expired / tampered.
 * Pure read — never writes cookies, so it is safe in Server Component render.
 */
export async function getCustomerToken(): Promise<string | null> {
  if (!customerAccountsEnabled()) return null;

  const jwe = (await cookies()).get(CUSTOMER_COOKIE)?.value;
  if (!jwe) return null;

  try {
    // jwtDecrypt enforces the `exp` claim — an expired JWE throws.
    const { payload } = await jwtDecrypt(jwe, await sessionKey());
    const accessToken = payload.accessToken;
    return typeof accessToken === "string" ? accessToken : null;
  } catch {
    // Expired, tampered, or SESSION_SECRET rotated — treat as signed out.
    return null;
  }
}

/** Delete the session cookie. MUST run in a Server Action or Route Handler. */
export async function clearCustomerToken(): Promise<void> {
  (await cookies()).delete(CUSTOMER_COOKIE);
}
