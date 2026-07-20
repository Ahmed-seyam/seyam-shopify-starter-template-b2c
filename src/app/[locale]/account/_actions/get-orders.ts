import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { CustomerOrder } from "../_types";

/** Empty when signed out. Server-side client for /api/account/orders. */
export async function getOrders({
  first = 10,
  locale,
}: { first?: number; locale?: string } = {}): Promise<CustomerOrder[]> {
  return callApi<CustomerOrder[]>("/api/account/orders", {
    searchParams: { first, locale },
    auth: true,
  });
}
