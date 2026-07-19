import type { Money } from "@/core/shopify/types";

export type Customer = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
  acceptsMarketing: boolean;
};

export type CustomerOrder = {
  id: string;
  /** Human order number, e.g. "#1001". */
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  totalPrice: Money;
};

/**
 * useActionState shape shared by the auth forms. `error` is a pre-translated
 * message (Server Actions translate via next-intl); `ok` flags a success that
 * shows inline rather than redirecting (password recovery). Lives here in the
 * client-safe types module so form components never import server-only code.
 */
export type AuthState = { error: string | null; ok?: boolean };

export const idleAuthState: AuthState = { error: null };

export type CustomerAddress = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  address1: string | null;
  address2: string | null;
  city: string | null;
  province: string | null;
  zip: string | null;
  country: string | null;
  phone: string | null;
  isDefault: boolean;
};

export type CustomerOrderLine = {
  title: string;
  quantity: number;
  totalPrice: Money;
  variantTitle: string | null;
  image: import("@/core/shopify/types").ShopifyImage | null;
};

export type CustomerOrderDetail = {
  id: string;
  name: string;
  orderNumber: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillmentStatus: string | null;
  subtotalPrice: Money | null;
  totalShippingPrice: Money;
  totalPrice: Money;
  shippingAddress: string[] | null;
  lineItems: CustomerOrderLine[];
};
