import type { Money } from "@/core/shopify/types";

export type Customer = {
  firstName: string | null;
  lastName: string | null;
  displayName: string;
  email: string | null;
};

export type CustomerOrder = {
  id: string;
  /** Human order number, e.g. "#1001". */
  name: string;
  processedAt: string;
  financialStatus: string | null;
  totalPrice: Money;
};
