"use server";

import { callApi } from "@/lib/server/api/http";
import type { Cart } from "../_types";

export type ApplyDiscountResult = {
  cart: Cart | null;
  /** False when Shopify accepted the mutation but the code isn't applicable. */
  applied: boolean;
};

export async function applyDiscount(
  code: string,
  locale?: string,
): Promise<ApplyDiscountResult> {
  return callApi<ApplyDiscountResult>("/api/cart/discount", {
    method: "POST",
    auth: true,
    body: { code, locale },
  });
}
