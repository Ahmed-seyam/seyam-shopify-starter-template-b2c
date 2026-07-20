import { ok, route } from "@/lib/server/api/route";
import { ShopifyUserError, storefrontMutation } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { CUSTOMER_ADDRESS_DELETE_MUTATION } from "../../_mutations/customer-address";

type DeleteBody = { id: string; locale?: string };

/** POST /api/account/address/delete (auth) — reached via deleteAddress. */
export const POST = route(async (request) => {
  const { id, locale } = (await request.json()) as DeleteBody;

  const token = await getCustomerToken();
  if (!token || !id) return ok(null);

  try {
    await storefrontMutation(
      "customerAddressDelete",
      CUSTOMER_ADDRESS_DELETE_MUTATION,
      { variables: { customerAccessToken: token, id }, locale },
    );
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  return ok(null);
});
