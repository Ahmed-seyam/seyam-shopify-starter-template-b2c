"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ShopifyUserError, storefrontMutation } from "@/core/shopify/client";
import { CUSTOMER_RECOVER_MUTATION } from "../mutations/customer-recover";
import type { AuthState } from "../types";
import { safeLocale } from "./shared";

const schema = z.object({ email: z.email() });

export async function recover(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = schema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: t("emailInvalid") };

  try {
    await storefrontMutation(
      "customerRecover",
      CUSTOMER_RECOVER_MUTATION,
      { variables: { email: parsed.data.email }, locale },
    );
  } catch (error) {
    // Swallow userErrors: the confirmation is deliberately identical whether
    // or not the email exists, so the form can't be used to enumerate accounts.
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  return { error: null, ok: true };
}
