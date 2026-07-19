import "server-only";
import { storefrontFetch } from "@/lib/shopify/client";
import { getCustomerToken } from "@/lib/shopify/customer-session";
import {
  flattenConnection,
  type Connection,
  type Money,
  type ShopifyImage,
} from "@/lib/shopify/types";
import { GET_ORDER_DETAILS_QUERY } from "../_queries/get-order";
import type { CustomerOrderDetail } from "../_types";

type RawOrder = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  subtotalPrice: Money | null;
  totalShippingPrice: Money;
  totalPrice: Money;
  shippingAddress: { formatted: string[] } | null;
  lineItems: Connection<{
    title: string;
    quantity: number;
    originalTotalPrice: Money;
    variant: { title: string; image: ShopifyImage | null } | null;
  }>;
};

/** Finds a signed-in customer's order by its number (e.g. "1001"). */
export async function getOrder(
  orderNumber: string,
  locale?: string
): Promise<CustomerOrderDetail | null> {
  const token = await getCustomerToken();
  if (!token) return null;

  const data = await storefrontFetch<{
    customer: { orders: Connection<RawOrder> } | null;
  }>(GET_ORDER_DETAILS_QUERY, {
    variables: { customerAccessToken: token, first: 50 },
    cache: "no-store",
    locale,
  });
  if (!data.customer) return null;

  const raw = flattenConnection(data.customer.orders).find(
    (order) => String(order.orderNumber) === orderNumber
  );
  if (!raw) return null;

  return {
    id: raw.id,
    name: raw.name,
    orderNumber: raw.orderNumber,
    processedAt: raw.processedAt,
    financialStatus: raw.financialStatus,
    fulfillmentStatus: raw.fulfillmentStatus,
    subtotalPrice: raw.subtotalPrice,
    totalShippingPrice: raw.totalShippingPrice,
    totalPrice: raw.totalPrice,
    shippingAddress: raw.shippingAddress?.formatted ?? null,
    lineItems: flattenConnection(raw.lineItems).map((line) => ({
      title: line.title,
      quantity: line.quantity,
      totalPrice: line.originalTotalPrice,
      variantTitle: line.variant?.title ?? null,
      image: line.variant?.image ?? null,
    })),
  };
}
