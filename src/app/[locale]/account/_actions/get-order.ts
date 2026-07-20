import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { CustomerOrderDetail } from "../_types";

/** Server-side client for /api/account/order (finds order by number). */
export async function getOrder(
  orderNumber: string,
  locale?: string,
): Promise<CustomerOrderDetail | null> {
  return callApi<CustomerOrderDetail | null>("/api/account/order", {
    searchParams: { orderNumber, locale },
    auth: true,
  });
}
