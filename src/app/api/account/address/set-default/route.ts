import { ok, route } from "@/lib/server/api/route";
import { ShopifyUserError, storefrontMutation } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION } from "../../_mutations/customer-address";

type SetDefaultBody = { id: string; locale?: string };

/** POST /api/account/address/set-default (auth) — reached via setDefaultAddress. */
export const POST = route(async (request) => {
  const { id, locale } = (await request.json()) as SetDefaultBody;

  const token = await getCustomerToken();
  if (!token || !id) return ok(null);

  try {
    await storefrontMutation(
      "customerDefaultAddressUpdate",
      CUSTOMER_DEFAULT_ADDRESS_UPDATE_MUTATION,
      { variables: { customerAccessToken: token, addressId: id }, locale },
    );
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  return ok(null);
});
