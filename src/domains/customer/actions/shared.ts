import "server-only";
import type { UserError } from "@/core/shopify/client";
import { saveCustomerToken } from "@/core/shopify/customer-session";
import { routing } from "@/i18n/routing";

/** Payload returned by the token-issuing mutations (create / reset). */
export type TokenPayload = {
  customerAccessToken: { accessToken: string; expiresAt: string } | null;
  userErrors: UserError[];
};

/**
 * A redirect target locale must be one the app actually serves — otherwise a
 * crafted `locale` form field becomes an open redirect / bogus path. Anything
 * unrecognised falls back to the default locale.
 */
export function safeLocale(value: FormDataEntryValue | null): string {
  const locale = typeof value === "string" ? value : "";
  return (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}

/** Persist the token a mutation returned (expiresAt is an ISO datetime). */
export async function persistToken(token: {
  accessToken: string;
  expiresAt: string;
}): Promise<void> {
  await saveCustomerToken({
    accessToken: token.accessToken,
    expiresAt: new Date(token.expiresAt).getTime(),
  });
}
