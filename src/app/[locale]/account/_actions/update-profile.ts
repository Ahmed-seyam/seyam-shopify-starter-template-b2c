"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { ShopifyUserError } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { profileSchema } from "@/validation/account";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

export async function updateProfile(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const token = await getCustomerToken();
  if (!token) return { error: t("generic") };

  const parsed = profileSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password") ?? "",
    acceptsMarketing: formData.get("acceptsMarketing") === "on",
  });
  if (!parsed.success) return { error: t("profileInvalid") };

  try {
    await callApi("/api/account/update-profile", {
      method: "POST",
      auth: true,
      body: { ...parsed.data, locale },
    });
  } catch (error) {
    if (error instanceof ShopifyUserError) return { error: t("profileInvalid") };
    throw error;
  }

  revalidatePath(`/${locale}/account`);
  return { error: null, ok: true };
}
