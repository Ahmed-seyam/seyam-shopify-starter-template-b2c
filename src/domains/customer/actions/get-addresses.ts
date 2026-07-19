import "server-only";
import { storefrontFetch } from "@/core/shopify/client";
import { getCustomerToken } from "@/core/shopify/customer-session";
import { flattenConnection, type Connection } from "@/core/shopify/types";
import { GET_ADDRESSES_QUERY } from "../queries/get-addresses";
import type { CustomerAddress } from "../types";

type RawAddress = Omit<CustomerAddress, "isDefault">;

export async function getAddresses(
  locale?: string
): Promise<CustomerAddress[]> {
  const token = await getCustomerToken();
  if (!token) return [];

  const data = await storefrontFetch<{
    customer: {
      defaultAddress: { id: string } | null;
      addresses: Connection<RawAddress>;
    } | null;
  }>(GET_ADDRESSES_QUERY, {
    variables: { customerAccessToken: token, first: 20 },
    cache: "no-store",
    locale,
  });
  if (!data.customer) return [];

  const defaultId = data.customer.defaultAddress?.id ?? null;
  return flattenConnection(data.customer.addresses).map((address) => ({
    ...address,
    isDefault: address.id === defaultId,
  }));
}
