"use server";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { z } from "zod";
import { ShopifyUserError, storefrontMutation } from "@/lib/shopify/client";
import { getCustomerToken } from "@/lib/shopify/customer-session";
import {
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_DELETE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
  CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
} from "../_mutations/customer-address";
import type { AuthState } from "../_types";
import { safeLocale } from "./shared";

const addressSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  address1: z.string().min(1).max(200),
  address2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1).max(100),
  province: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().min(1).max(20),
  country: z.string().min(1).max(100),
  phone: z.string().max(30).optional().or(z.literal("")),
});

/** Create (no id field) or update (id present) an address from the dialog form. */
export async function saveAddress(
  _prev: AuthState,
  formData: FormData
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const token = await getCustomerToken();
  if (!token) return { error: t("generic") };

  const parsed = addressSchema.safeParse(
    Object.fromEntries(
      [
        "firstName",
        "lastName",
        "address1",
        "address2",
        "city",
        "province",
        "zip",
        "country",
        "phone",
      ].map((key) => [key, formData.get(key) ?? ""])
    )
  );
  if (!parsed.success) return { error: t("addressInvalid") };

  const id = formData.get("id");
  const address = parsed.data;

  try {
    if (typeof id === "string" && id) {
      await storefrontMutation(
        "customerAddressUpdate",
        CUSTOMER_ADDRESS_UPDATE_MUTATION,
        { variables: { customerAccessToken: token, id, address }, locale }
      );
    } else {
      await storefrontMutation(
        "customerAddressCreate",
        CUSTOMER_ADDRESS_CREATE_MUTATION,
        { variables: { customerAccessToken: token, address }, locale }
      );
    }
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

  try {
    await storefrontMutation(
      "customerAddressDelete",
      CUSTOMER_ADDRESS_DELETE_MUTATION,
      { variables: { customerAccessToken: token, id }, locale }
    );
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  revalidatePath(`/${locale}/account/addresses`);
}

export async function setDefaultAddress(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));
  const id = formData.get("id");
  const token = await getCustomerToken();
  if (!token || typeof id !== "string" || !id) return;

  try {
    await storefrontMutation(
      "customerDefaultAddressUpdate",
      CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
      { variables: { customerAccessToken: token, addressId: id }, locale }
    );
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  revalidatePath(`/${locale}/account/addresses`);
}
