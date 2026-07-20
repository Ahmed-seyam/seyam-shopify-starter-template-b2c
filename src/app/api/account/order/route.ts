import type { CustomerOrderDetail } from "@/app/[locale]/account/_types";
import { ok, route } from "@/lib/server/api/route";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import {
  flattenConnection,
  type Connection,
  type Money,
  type ShopifyImage,
} from "@/types/shopify";
import { GET_ORDER_DETAILS_QUERY } from "../_queries/get-order";

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

/**
 * GET /api/account/order?orderNumber=&locale= (auth). Finds a signed-in
 * customer's order by its number. Reached via getOrder (account/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const orderNumber = searchParams.get("orderNumber") ?? "";
  const locale = searchParams.get("locale") ?? undefined;

  const token = await getCustomerToken();
  if (!token) return ok<CustomerOrderDetail | null>(null);

  const data = await storefrontFetch<{
    customer: { orders: Connection<RawOrder> } | null;
  }>(GET_ORDER_DETAILS_QUERY, {
    variables: { customerAccessToken: token, first: 50 },
    cache: "no-store",
    locale,
  });
  if (!data.customer) return ok<CustomerOrderDetail | null>(null);

  const raw = flattenConnection(data.customer.orders).find(
    (order) => String(order.orderNumber) === orderNumber,
  );
  if (!raw) return ok<CustomerOrderDetail | null>(null);

  return ok<CustomerOrderDetail>({
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
  });
});
