import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { Customer } from "../_types";

/** Null = signed out. Server-side client for /api/account/customer. */
export async function getCustomer(locale?: string): Promise<Customer | null> {
  return callApi<Customer | null>("/api/account/customer", {
    searchParams: { locale },
    auth: true,
  });
}
