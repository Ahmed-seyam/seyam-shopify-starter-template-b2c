import type { Customer } from "@/app/[locale]/account/_types";
import { ok, route } from "@/lib/server/api/route";
import { storefrontFetch } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { GET_CUSTOMER_QUERY } from "../_queries/get-customer";

type RawCustomer = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  acceptsMarketing: boolean;
};

/**
 * GET /api/account/customer?locale= (auth). Null = signed out — never throws.
 * Reached via getCustomer (account/_actions).
 */
export const GET = route(async (request) => {
  const { searchParams } = new URL(request.url);
  const locale = searchParams.get("locale") ?? undefined;

  const token = await getCustomerToken();
  if (!token) return ok<Customer | null>(null);

  const data = await storefrontFetch<{ customer: RawCustomer | null }>(
    GET_CUSTOMER_QUERY,
    { variables: { customerAccessToken: token }, cache: "no-store", locale },
  );
  if (!data.customer) return ok<Customer | null>(null);

  return ok<Customer>({
    firstName: data.customer.firstName,
    lastName: data.customer.lastName,
    displayName: data.customer.displayName,
    email: data.customer.email,
    acceptsMarketing: data.customer.acceptsMarketing,
  });
});
