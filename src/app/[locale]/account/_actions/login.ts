"use server";

import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { ShopifyUserError } from "@/plugins/server/shopify/client";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { loginSchema } from "@/validation/auth";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

export async function login(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) return { error: t("invalidCredentials") };

  try {
    const { authenticated } = await callApi<{ authenticated: boolean }>(
      "/api/account/login",
      { method: "POST", auth: true, body: { ...parsed.data, locale } },
    );
    if (!authenticated) return { error: t("invalidCredentials") };
  } catch (error) {
    // Never reveal whether it was the email or the password that was wrong.
    if (error instanceof ShopifyUserError) {
      return { error: t("invalidCredentials") };
    }
    throw error;
  }

  // Link any existing guest cart to the customer (token cookie is now set this
  // request, and callApi forwards it to the cart endpoint).
  await syncCartBuyerIdentity(locale);

  // redirect() throws NEXT_REDIRECT — must run outside the try/catch above.
  redirect({ href: "/account", locale });
  return { error: null }; // unreachable: redirect() throws.
}
