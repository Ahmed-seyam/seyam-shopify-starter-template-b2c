"use server";

import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { ShopifyUserError } from "@/plugins/server/shopify/client";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { resetSchema, resetUrlSchema } from "@/validation/auth";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

export async function reset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const resetUrl = resetUrlSchema.safeParse(formData.get("resetUrl"));
  if (!resetUrl.success) return { error: t("resetLinkInvalid") };

  const parsed = resetSchema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: t("passwordTooShort") };

  try {
    const { authenticated } = await callApi<{ authenticated: boolean }>(
      "/api/account/reset",
      {
        method: "POST",
        auth: true,
        body: {
          resetUrl: resetUrl.data,
          password: parsed.data.password,
          locale,
        },
      },
    );
    if (!authenticated) return { error: t("resetLinkInvalid") };
  } catch (error) {
    if (error instanceof ShopifyUserError) {
      return { error: t("resetLinkInvalid") };
    }
    throw error;
  }

  await syncCartBuyerIdentity(locale);

  redirect({ href: "/account", locale });
  return { error: null }; // unreachable: redirect() throws.
}
