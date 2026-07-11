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

/**
 * useActionState shape shared by the auth forms. `error` is a pre-translated
 * message (Server Actions translate via next-intl); `ok` flags a success that
 * shows inline rather than redirecting (password recovery). Lives here in the
 * client-safe types module so form components never import server-only code.
 */
export type AuthState = { error: string | null; ok?: boolean };

export const idleAuthState: AuthState = { error: null };
