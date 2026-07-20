"use server";

import { callApi } from "@/lib/server/api/http";
import { syncCartBuyerIdentity } from "@/app/[locale]/cart";
import { redirect } from "@/i18n/navigation";
import { safeLocale } from "@/app/[locale]/_utils";

/**
 * Bound as a `<form action>` (not useActionState) — takes FormData directly.
 * The endpoint invalidates + clears the token cookie; callApi propagates the
 * deletion, then we drop the customer link from the cart.
 */
export async function logout(formData: FormData): Promise<void> {
  const locale = safeLocale(formData.get("locale"));

  await callApi("/api/account/logout", { method: "POST", auth: true });
  // Token is now cleared this request — syncCartBuyerIdentity forwards the
  // cleared cookie so the next checkout isn't attributed to the ex-customer.
  await syncCartBuyerIdentity(locale);
  redirect({ href: "/account", locale });
}
