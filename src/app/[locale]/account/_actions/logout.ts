"use server";

import { storefrontMutation } from "@/app/core/shopify/client";
import {
  clearCustomerToken,
  getCustomerToken,
} from "@/app/core/shopify/customer-session";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION } from "../_mutations/customer-access-token-delete";
import { safeLocale } from "./shared";

/**
 * Bound as a `<form action>` (not useActionState) — takes FormData directly.
 * Best-effort server-side invalidation, then always drop the local cookie.
 */
export async function logout(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));

  const token = await getCustomerToken();
  if (token) {
    try {
      await storefrontMutation(
        "customerAccessTokenDelete",
        CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
        { variables: { customerAccessToken: token } },
      );
    } catch {
      // Token already expired/invalid at Shopify — the cookie clear below is
      // what actually signs the user out locally.
    }
  }

  await clearCustomerToken();
  // Drop the customer link from the cart (token is now cleared) so the next
  // checkout isn't attributed to the customer who just signed out.
  await syncCartBuyerIdentity(locale);
  redirect({ href: "/account", locale });
}
