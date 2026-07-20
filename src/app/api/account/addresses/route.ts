import type { CustomerAddress } from "@/app/[locale]/account/_types";
import { ok, route } from "@/lib/server/api/route";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { flattenConnection, type Connection } from "@/types/shopify";
import { GET_ADDRESSES_QUERY } from "../_queries/get-addresses";

type RawAddress = Omit<CustomerAddress, "isDefault">;

/**
 * GET /api/account/addresses?locale= (auth). Reached via getAddresses
 * (account/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? undefined;

  const token = await getCustomerToken();
  if (!token) return ok<CustomerAddress[]>([]);

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
  if (!data.customer) return ok<CustomerAddress[]>([]);

  const defaultId = data.customer.defaultAddress?.id ?? null;
  return ok<CustomerAddress[]>(
    flattenConnection(data.customer.addresses).map((address) => ({
      ...address,
      isDefault: address.id === defaultId,
    })),
  );
});
