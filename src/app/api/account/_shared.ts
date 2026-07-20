import "server-only";
import type { UserError } from "@/plugins/server/shopify/client";
import { saveCustomerToken } from "@/plugins/server/shopify/customer-session";

/** Payload returned by the token-issuing mutations (create / reset). */
export type TokenPayload = {
  customerAccessToken: { accessToken: string; expiresAt: string } | null;
  userErrors: UserError[];
};

/**
 * Persist the token a mutation returned (expiresAt is an ISO datetime). Runs
 * inside the Route Handler; the Set-Cookie it produces is propagated back to
 * the browser by callApi.
 */
export async function persistToken(token: {
  accessToken: string;
  expiresAt: string;
}): Promise<void> {
  await saveCustomerToken({
    accessToken: token.accessToken,
    expiresAt: new Date(token.expiresAt).getTime(),
  });
}
