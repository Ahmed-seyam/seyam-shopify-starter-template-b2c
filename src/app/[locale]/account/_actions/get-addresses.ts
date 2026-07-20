import "server-only";
import { callApi } from "@/lib/server/api/http";
import type { CustomerAddress } from "../_types";

/** Server-side client for /api/account/addresses. */
export async function getAddresses(
  locale?: string,
): Promise<CustomerAddress[]> {
  return callApi<CustomerAddress[]>("/api/account/addresses", {
    searchParams: { locale },
    auth: true,
  });
}
