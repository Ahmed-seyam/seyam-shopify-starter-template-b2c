"use server";

import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { ShopifyUserError } from "@/plugins/server/shopify/client";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { registerSchema } from "@/validation/auth";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = registerSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error:
        issue?.path[0] === "password"
          ? t("passwordTooShort")
          : t("emailInvalid"),
    };
  }

  let signedIn = false;
  try {
    const result = await callApi<{ signedIn: boolean }>(
      "/api/account/register",
      { method: "POST", auth: true, body: { ...parsed.data, locale } },
    );
    signedIn = result.signedIn;
  } catch (error) {
    if (error instanceof ShopifyUserError) {
      const code = error.userErrors[0]?.code;
      if (code === "TAKEN" || code === "CUSTOMER_DISABLED") {
        return { error: t("emailTaken") };
      }
      // Surface Shopify's own message for password-policy rejections etc.
      return { error: error.userErrors[0]?.message ?? t("generic") };
    }
    throw error;
  }

  if (signedIn) await syncCartBuyerIdentity(locale);

  redirect({ href: signedIn ? "/account" : "/account/login", locale });
  return { error: null }; // unreachable: redirect() throws.
}
