"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ShopifyUserError, storefrontMutation } from "@/core/shopify/client";
import { syncCartBuyerIdentity } from "@/domains/cart";
import { redirect } from "@/i18n/navigation";
import { CUSTOMER_RESET_MUTATION } from "../mutations/customer-reset";
import type { AuthState } from "../types";
import { persistToken, safeLocale, type TokenPayload } from "./shared";

const schema = z.object({ password: z.string().min(8) });

export async function reset(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const id = formData.get("id");
  const token = formData.get("token");
  if (typeof id !== "string" || typeof token !== "string" || !id || !token) {
    return { error: t("resetLinkInvalid") };
  }

  const parsed = schema.safeParse({ password: formData.get("password") });
  if (!parsed.success) return { error: t("passwordTooShort") };

  try {
    const payload = await storefrontMutation<TokenPayload>(
      "customerReset",
      CUSTOMER_RESET_MUTATION,
      {
        variables: {
          id: `gid://shopify/Customer/${id}`,
          input: { resetToken: token, password: parsed.data.password },
        },
        locale,
      },
    );
    if (!payload.customerAccessToken) return { error: t("resetLinkInvalid") };
    await persistToken(payload.customerAccessToken);
  } catch (error) {
    if (error instanceof ShopifyUserError) return { error: t("resetLinkInvalid") };
    throw error;
  }

  await syncCartBuyerIdentity(locale);

  redirect({ href: "/account", locale });
  return { error: null }; // unreachable: redirect() throws.
}
