import "server-only";
import { ShopifyError } from "./client";
import { customerAuthConfig, getCustomerAccessToken } from "./customer-auth";

/** Thrown when a customer query runs without a signed-in session. */
export class CustomerAuthRequiredError extends Error {
  constructor(message = "Customer is not authenticated") {
    super(message);
    this.name = "CustomerAuthRequiredError";
  }
}

/**
 * Single egress point to the Customer Account API. Auth is transparent:
 * the access token comes from the encrypted session and refreshes itself
 * (core/shopify/customer-auth). Never cached — customer data is per-user.
 */
export async function customerAccountFetch<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const config = customerAuthConfig();
  if (!config) throw new CustomerAuthRequiredError("Customer accounts not configured");

  const accessToken = await getCustomerAccessToken();
  if (!accessToken) throw new CustomerAuthRequiredError();

  const response = await fetch(config.graphqlUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // Customer Account API expects the raw token, no "Bearer" prefix.
      Authorization: accessToken,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  if (response.status === 401) throw new CustomerAuthRequiredError();
  if (!response.ok) {
    throw new ShopifyError(
      `Customer Account API responded with ${response.status}`,
      response.status,
      query,
    );
  }

  const body = (await response.json()) as {
    data: T;
    errors?: Array<{ message: string }>;
  };

  if (body.errors?.length) {
    throw new ShopifyError(
      body.errors.map((error) => error.message).join("; "),
      200,
      query,
    );
  }

  return body.data;
}
