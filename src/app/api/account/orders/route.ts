import type { CustomerOrder } from "@/app/[locale]/account/_types";
import { ok, route } from "@/lib/server/api/route";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { flattenConnection, type Connection } from "@/types/shopify";
import { GET_ORDERS_QUERY } from "../_queries/get-orders";

/**
 * GET /api/account/orders?first=&locale= (auth). Empty when signed out.
 * Reached via getOrders (account/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const first = Number(searchParams.get("first") ?? 10);
  const locale = searchParams.get("locale") ?? undefined;

  const token = await getCustomerToken();
  if (!token) return ok<CustomerOrder[]>([]);

  const data = await storefrontFetch<{
    customer: { orders: Connection<CustomerOrder> } | null;
  }>(GET_ORDERS_QUERY, {
    variables: { customerAccessToken: token, first },
    cache: "no-store",
    locale,
  });

  return ok(data.customer ? flattenConnection(data.customer.orders) : []);
});
