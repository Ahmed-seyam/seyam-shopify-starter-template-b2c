import "server-only";
import { EncryptJWT, jwtDecrypt } from "jose";
import { env } from "@/core/config/env";
import { clearSession, getSession, persistSession } from "./session";

/**
 * Customer Account API auth (OAuth 2.0 / OIDC with PKCE, public client).
 * Tokens live in the encrypted `customer` session cookie; refresh follows
 * the global session rule — always persist what Shopify RETURNS, since
 * refresh tokens rotate on every use.
 *
 * Setup (Shopify admin → Settings → Customer accounts → API clients):
 * SHOPIFY_SHOP_ID, SHOPIFY_CUSTOMER_CLIENT_ID, SESSION_SECRET, and add
 * `${SITE_URL}/api/auth/callback` as an allowed redirect URI.
 */

/** Short-lived cookie carrying PKCE verifier + state across the redirect. */
export const AUTH_FLOW_COOKIE = "customerAuthFlow";

export type CustomerTokens = {
  accessToken: string;
  refreshToken: string;
  idToken: string;
  /** Epoch ms when accessToken expires. */
  expiresAt: number;
};

export type CustomerAuthConfig = {
  clientId: string;
  authorizeUrl: string;
  tokenUrl: string;
  logoutUrl: string;
  graphqlUrl: string;
  redirectUri: string;
};

/** Null when the store hasn't configured customer accounts — UI degrades. */
export function customerAuthConfig(): CustomerAuthConfig | null {
  const config = env();
  const shopId = config.SHOPIFY_SHOP_ID;
  const clientId = config.SHOPIFY_CUSTOMER_CLIENT_ID;
  if (!shopId || !clientId || !config.SESSION_SECRET) return null;

  return {
    clientId,
    authorizeUrl: `https://shopify.com/authentication/${shopId}/oauth/authorize`,
    tokenUrl: `https://shopify.com/authentication/${shopId}/oauth/token`,
    logoutUrl: `https://shopify.com/authentication/${shopId}/logout`,
    graphqlUrl: `https://shopify.com/${shopId}/account/customer/api/${config.SHOPIFY_API_VERSION}/graphql`,
    redirectUri: `${config.SITE_URL}/api/auth/callback`,
  };
}

// ---------------------------------------------------------------------------
// Encrypted session cookie (JWE, dir + A256GCM)

async function sessionKey(): Promise<Uint8Array> {
  const secret = env().SESSION_SECRET;
  if (!secret) throw new Error("SESSION_SECRET is not configured");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(secret),
  );
  return new Uint8Array(digest);
}

export async function saveCustomerTokens(tokens: CustomerTokens): Promise<void> {
  const jwe = await new EncryptJWT({ ...tokens })
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .setIssuedAt()
    .encrypt(await sessionKey());
  await persistSession("customer", jwe);
}

export async function loadCustomerTokens(): Promise<CustomerTokens | null> {
  const jwe = await getSession("customer");
  if (!jwe) return null;

  try {
    const { payload } = await jwtDecrypt(jwe, await sessionKey());
    return {
      accessToken: String(payload.accessToken),
      refreshToken: String(payload.refreshToken),
      idToken: String(payload.idToken),
      expiresAt: Number(payload.expiresAt),
    };
  } catch {
    // Tampered / SESSION_SECRET rotated — treat as signed out.
    await clearSession("customer");
    return null;
  }
}

export async function clearCustomerTokens(): Promise<void> {
  await clearSession("customer");
}

// ---------------------------------------------------------------------------
// OAuth flow (PKCE)

function base64url(bytes: Uint8Array): string {
  return Buffer.from(bytes)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export type AuthorizationRequest = {
  url: string;
  state: string;
  verifier: string;
};

export async function buildAuthorizationRequest(
  config: CustomerAuthConfig,
): Promise<AuthorizationRequest> {
  const state = base64url(crypto.getRandomValues(new Uint8Array(16)));
  const verifier = base64url(crypto.getRandomValues(new Uint8Array(32)));
  const challenge = base64url(
    new Uint8Array(
      await crypto.subtle.digest(
        "SHA-256",
        new TextEncoder().encode(verifier),
      ),
    ),
  );

  const url = new URL(config.authorizeUrl);
  url.searchParams.set("scope", "openid email customer-account-api:full");
  url.searchParams.set("client_id", config.clientId);
  url.searchParams.set("response_type", "code");
  url.searchParams.set("redirect_uri", config.redirectUri);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");

  return { url: url.toString(), state, verifier };
}

type TokenResponse = {
  access_token: string;
  refresh_token: string;
  id_token?: string;
  expires_in: number;
};

async function requestTokens(
  config: CustomerAuthConfig,
  body: Record<string, string>,
): Promise<CustomerTokens> {
  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, ...body }),
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(
      `Customer token endpoint responded with ${response.status}`,
    );
  }

  const data = (await response.json()) as TokenResponse;
  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    idToken: data.id_token ?? "",
    expiresAt: Date.now() + data.expires_in * 1000,
  };
}

export function exchangeCodeForTokens(
  config: CustomerAuthConfig,
  code: string,
  verifier: string,
): Promise<CustomerTokens> {
  return requestTokens(config, {
    grant_type: "authorization_code",
    redirect_uri: config.redirectUri,
    code,
    code_verifier: verifier,
  });
}

/**
 * Returns a valid access token, transparently refreshing an expiring one
 * (rotated tokens are re-persisted). Null = signed out / not configured.
 */
export async function getCustomerAccessToken(): Promise<string | null> {
  const config = customerAuthConfig();
  if (!config) return null;

  const tokens = await loadCustomerTokens();
  if (!tokens) return null;

  // 60s clock-skew margin before the hard expiry.
  if (tokens.expiresAt - 60_000 > Date.now()) return tokens.accessToken;

  try {
    const refreshed = await requestTokens(config, {
      grant_type: "refresh_token",
      refresh_token: tokens.refreshToken,
    });
    // Shopify does not return a new id_token on refresh — keep it for logout.
    const next = { ...refreshed, idToken: tokens.idToken };
    await saveCustomerTokens(next);
    return next.accessToken;
  } catch {
    await clearCustomerTokens();
    return null;
  }
}
