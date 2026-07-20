"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { ShopifyUserError } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { addressSchema, addressFields } from "@/validation/account";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

/** Create (no id field) or update (id present) an address from the dialog form. */
export async function saveAddress(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const token = await getCustomerToken();
  if (!token) return { error: t("generic") };

  const parsed = addressSchema.safeParse(
    Object.fromEntries(
      addressFields.map((key) => [key, formData.get(key) ?? ""]),
    ),
  );
  if (!parsed.success) return { error: t("addressInvalid") };

  const idValue = formData.get("id");
  const id = typeof idValue === "string" && idValue ? idValue : undefined;

  try {
    await callApi("/api/account/address/save", {
      method: "POST",
      auth: true,
      body: { address: parsed.data, id, locale },
    });
  } catch (error) {
    if (error instanceof ShopifyUserError) return { error: t("addressInvalid") };
    throw error;
  }

  revalidatePath(`/${locale}/account/addresses`);
  return { error: null, ok: true };
}

export async function deleteAddress(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  const id = formData.get("id");
  const token = await getCustomerToken();
  if (!token || typeof id !== "string" || !id) return;

  await callApi("/api/account/address/delete", {
    method: "POST",
    auth: true,
    body: { id, locale },
  });

  revalidatePath(`/${locale}/account/addresses`);
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  const id = formData.get("id");
  const token = await getCustomerToken();
  if (!token || typeof id !== "string" || !id) return;

  await callApi("/api/account/address/set-default", {
    method: "POST",
    auth: true,
    body: { id, locale },
  });

  revalidatePath(`/${locale}/account/addresses`);
}
