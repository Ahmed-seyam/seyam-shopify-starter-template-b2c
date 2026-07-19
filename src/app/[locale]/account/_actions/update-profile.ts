"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ShopifyUserError, storefrontMutation } from "@/app/core/shopify/client";
import { getCustomerToken } from "@/app/core/shopify/customer-session";
import { CUSTOMER_UPDATE_MUTATION } from "../_mutations/customer-update";
import type { AuthState } from "../_types";
import { persistToken, safeLocale, type TokenPayload } from "./shared";

const schema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.email(),
  password: z.string().min(8).max(128).optional().or(z.literal("")),
  acceptsMarketing: z.boolean(),
});

type UpdatePayload = {
  customer: { id: string } | null;
  customerAccessToken: { accessToken: string; expiresAt: string } | null;
  userErrors: TokenPayload["userErrors"];
};

export async function updateProfile(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const token = await getCustomerToken();
  if (!token) return { error: t("generic") };

  const parsed = schema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });
  if (!parsed.success) return { error: t("profileInvalid") };

  const { password, ...rest } = parsed.data;

  try {
    const payload = await storefrontMutation<UpdatePayload>(
      "customerUpdate",
      CUSTOMER_UPDATE_MUTATION,
      {
        variables: {
          customerAccessToken: token,
          customer: password ? { ...rest, password } : rest,
        },
        locale,
      }
    );
    // Email/password changes rotate the token — persist the fresh one so the
    // session survives.
    if (payload.customerAccessToken) {
      await persistToken(payload.customerAccessToken);
    }
  } catch (error) {
    if (error instanceof ShopifyUserError) return { error: t("profileInvalid") };
    throw error;
  }

  revalidatePath(`/${locale}/account`);
  return { error: null, ok: true };
}
