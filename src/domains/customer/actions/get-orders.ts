import "server-only";
import {
  CustomerAuthRequiredError,
  customerAccountFetch,
} from "@/core/shopify/customer-client";
import { flattenConnection, type Connection } from "@/core/shopify/types";
import { GET_ORDERS_QUERY } from "../queries/get-orders";
import type { CustomerOrder } from "../types";

/** Empty when signed out — the account page gates on getCustomer first. */
export async function getOrders(
  { first = 10 }: { first?: number } = {},
): Promise<CustomerOrder[]> {
  try {
    const data = await customerAccountFetch<{
      customer: { orders: Connection<CustomerOrder> };
    }>(GET_ORDERS_QUERY, { first });
    return flattenConnection(data.customer.orders);
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) return [];
    throw error;
  }
}
