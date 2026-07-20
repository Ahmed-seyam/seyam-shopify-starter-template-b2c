import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import {
  clearCustomerToken,
  getCustomerToken,
} from "@/plugins/server/shopify/customer-session";
import { CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION } from "../_mutations/customer-access-token-delete";

/**
 * POST /api/account/logout — reached via the logout form action. Best-effort
 * server-side invalidation, then always drop the local cookie (deletion is
 * propagated back by callApi so the browser signs out).
 */
export const POST = route(async () => {
  const token = await getCustomerToken();
  if (token) {
    try {
      await storefrontMutation(
        "customerAccessTokenDelete",
        CUSTOMER_ACCESS_TOKEN_DELETE_MUTATION,
        { variables: { customerAccessToken: token } },
      );
    } catch {
      // Token already expired/invalid at Shopify — the cookie clear below is
      // what actually signs the user out locally.
    }
  }

  await clearCustomerToken();
  return ok(null);
});
