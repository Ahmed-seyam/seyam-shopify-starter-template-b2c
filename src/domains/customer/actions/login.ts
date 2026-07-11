"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ShopifyUserError, storefrontMutation } from "@/core/shopify/client";
import { syncCartBuyerIdentity } from "@/domains/cart";
import { redirect } from "@/i18n/navigation";
import { CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION } from "../mutations/customer-access-token-create";
import type { AuthState } from "../types";
import { persistToken, safeLocale, type TokenPayload } from "./shared";

const schema = z.object({
  email: z.email(),
  password: z.string().min(1),
});

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t("invalidCredentials") };

  try {
    const payload = await storefrontMutation<TokenPayload>(
      "customerAccessTokenCreate",
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      { variables: { input: parsed.data }, locale },
    );
    // Shopify reports bad credentials as a userError (thrown below); a null
    // token without one would be an unexpected shape — treat as failure.
    if (!payload.customerAccessToken) return { error: t("invalidCredentials") };
    await persistToken(payload.customerAccessToken);
  } catch (error) {
    // Never reveal whether it was the email or the password that was wrong.
    if (error instanceof ShopifyUserError) return { error: t("invalidCredentials") };
    throw error;
  }

  // Link any existing guest cart to the customer so checkout is attributed
  // to them (token is now in the cookie, read within this same request).
  await syncCartBuyerIdentity(locale);

  // redirect() throws NEXT_REDIRECT — must run outside the try/catch above.
  redirect({ href: "/account", locale });
  return { error: null }; // unreachable: redirect() throws.
}
