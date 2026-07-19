"use server";

import { getTranslations } from "next-intl/server";
import { z } from "zod";
import {
  ShopifyUserError,
  storefrontMutation,
  type UserError,
} from "@/app/core/shopify/client";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION } from "../_mutations/customer-access-token-create";
import { CUSTOMER_CREATE_MUTATION } from "../_mutations/customer-create";
import type { AuthState } from "../_types";
import { persistToken, safeLocale, type TokenPayload } from "./shared";

const schema = z.object({
  email: z.email(),
  // Shopify enforces its own policy; 8 is a friendly client-visible floor.
  password: z.string().min(8),
  firstName: z.string().trim().optional(),
  lastName: z.string().trim().optional(),
});

type CreatePayload = { customer: { id: string } | null; userErrors: UserError[] };

export async function register(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    firstName: formData.get("firstName") || undefined,
    lastName: formData.get("lastName") || undefined,
  });
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    return {
      error: issue?.path[0] === "password" ? t("passwordTooShort") : t("emailInvalid"),
    };
  }

  try {
    await storefrontMutation<CreatePayload>(
      "customerCreate",
      CUSTOMER_CREATE_MUTATION,
      { variables: { input: parsed.data }, locale },
    );
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

  // Auto sign-in so the new customer lands on their account, not the login page.
  let signedIn = false;
  try {
    const payload = await storefrontMutation<TokenPayload>(
      "customerAccessTokenCreate",
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      {
        variables: {
          input: { email: parsed.data.email, password: parsed.data.password },
        },
        locale,
      },
    );
    if (payload.customerAccessToken) {
      await persistToken(payload.customerAccessToken);
      signedIn = true;
    }
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
    // Account exists but auto-login failed — send them to sign in manually.
  }

  if (signedIn) await syncCartBuyerIdentity(locale);

  redirect({ href: signedIn ? "/account" : "/account/login", locale });
  return { error: null }; // unreachable: redirect() throws.
}
