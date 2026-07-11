import "server-only";
import {
  CustomerAuthRequiredError,
  customerAccountFetch,
} from "@/core/shopify/customer-client";
import { GET_CUSTOMER_QUERY } from "../queries/get-customer";
import type { Customer } from "../types";

type RawCustomer = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  emailAddress: { emailAddress: string } | null;
};

/** Null = signed out (or accounts not configured) — never throws for that. */
export async function getCustomer(): Promise<Customer | null> {
  try {
    const data = await customerAccountFetch<{ customer: RawCustomer }>(
      GET_CUSTOMER_QUERY,
    );
    return {
      firstName: data.customer.firstName,
      lastName: data.customer.lastName,
      displayName: data.customer.displayName,
      email: data.customer.emailAddress?.emailAddress ?? null,
    };
  } catch (error) {
    if (error instanceof CustomerAuthRequiredError) return null;
    throw error;
  }
}
