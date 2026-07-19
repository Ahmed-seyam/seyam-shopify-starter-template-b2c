import "server-only";
import { storefrontFetch } from "@/app/core/shopify/client";
import { getCustomerToken } from "@/app/core/shopify/customer-session";
import { GET_CUSTOMER_QUERY } from "../_queries/get-customer";
import type { Customer } from "../_types";

type RawCustomer = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  acceptsMarketing: boolean;
};

/** Null = signed out (no/expired token or accounts disabled) — never throws. */
export async function getCustomer(locale?: string): Promise<Customer | null> {
  const token = await getCustomerToken();
  if (!token) return null;

  const data = await storefrontFetch<{ customer: RawCustomer | null }>(
    GET_CUSTOMER_QUERY,
    { variables: { customerAccessToken: token }, cache: "no-store", locale },
  );
  if (!data.customer) return null;

  return {
    firstName: data.customer.firstName,
    lastName: data.customer.lastName,
    displayName: data.customer.displayName,
    email: data.customer.email,
    acceptsMarketing: data.customer.acceptsMarketing,
  };
}
