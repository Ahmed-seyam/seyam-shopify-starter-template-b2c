"use server";

import { callApi } from "@/lib/server/api/http";
import type { Cart } from "../_types";

export async function removeLine(
  lineId: string,
  locale?: string,
): Promise<Cart | null> {
  return callApi<Cart | null>("/api/cart/remove-line", {
    method: "POST",
    auth: true,
    body: { lineId, locale },
  });
}
