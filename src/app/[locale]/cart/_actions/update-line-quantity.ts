"use server";

import { callApi } from "@/lib/server/api/http";
import type { Cart } from "../_types";

export async function updateLineQuantity(
  lineId: string,
  quantity: number,
  locale?: string,
): Promise<Cart | null> {
  // quantity <= 0 is handled by the endpoint (removes the line).
  return callApi<Cart | null>("/api/cart/update-line", {
    method: "POST",
    auth: true,
    body: { lineId, quantity, locale },
  });
}
