import "server-only";
import { storefrontFetch } from "@/lib/shopify/client";
import { getCustomerToken } from "@/lib/shopify/customer-session";
import { flattenConnection, type Connection } from "@/lib/shopify/types";
import { GET_ORDERS_QUERY } from "../_queries/get-orders";
import type { CustomerOrder } from "../_types";

/** Empty when signed out — the account page gates on getCustomer first. */
export async function getOrders(
  { first = 10, locale }: { first?: number; locale?: string } = {},
): Promise<CustomerOrder[]> {
  const token = await getCustomerToken();
  if (!token) return [];

  const data = await storefrontFetch<{
    customer: { orders: Connection<CustomerOrder> } | null;
  }>(GET_ORDERS_QUERY, {
    variables: { customerAccessToken: token, first },
    cache: "no-store",
    locale,
  });

  return data.customer ? flattenConnection(data.customer.orders) : [];
}
