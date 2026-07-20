"use server";

import { getTranslations } from "next-intl/server";
import { callApi } from "@/lib/server/api/http";
import { recoverSchema } from "@/validation/auth";
import type { AuthState } from "../_types";
import { safeLocale } from "@/app/[locale]/_utils";

export async function recover(
  _prev: AuthState,
  formData: FormData,
): Promise<AuthState> {
  const locale = safeLocale(formData.get("locale"));
  const t = await getTranslations({ locale, namespace: "account.errors" });

  const parsed = recoverSchema.safeParse({ email: formData.get("email") });
  if (!parsed.success) return { error: t("emailInvalid") };

  // The endpoint deliberately returns the same result whether or not the email
  // exists (no account enumeration).
  await callApi("/api/account/recover", {
    method: "POST",
    auth: true,
    body: { ...parsed.data, locale },
  });

  return { error: null, ok: true };
}
