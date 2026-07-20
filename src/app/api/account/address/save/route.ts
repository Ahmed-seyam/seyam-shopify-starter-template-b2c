import { z } from "zod";
import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { readJson } from "@/app/api/_utils";
import { addressSchema } from "@/validation/account";
import {
  CUSTOMER_ADDRESS_CREATE_MUTATION,
  CUSTOMER_ADDRESS_UPDATE_MUTATION,
} from "../../_mutations/customer-address";

// Same shared schema the client/action validate against — re-checked here so
// the endpoint is safe on its own, not just when reached through the action.
const saveBodySchema = z.object({
  address: addressSchema,
  id: z.string().optional(),
  locale: z.string().optional(),
});

/**
 * POST /api/account/address/save (auth) — create (no id) or update (id present).
 * Reached via saveAddress. A ShopifyUserError is mapped by the action.
 */
export const POST = route(async (request) => {
  const parsed = saveBodySchema.safeParse(await readJson(request));
  if (!parsed.success) {
    return ok(null); // reject invalid payloads without touching Shopify
  }
  const { address, id, locale } = parsed.data;

  const token = await getCustomerToken();
  if (!token) return ok(null);

  if (id) {
    await storefrontMutation(
      "customerAddressUpdate",
      CUSTOMER_ADDRESS_UPDATE_MUTATION,
      { variables: { customerAccessToken: token, id, address }, locale },
    );
  } else {
    await storefrontMutation(
      "customerAddressCreate",
      CUSTOMER_ADDRESS_CREATE_MUTATION,
      { variables: { customerAccessToken: token, address }, locale },
    );
  }

  return ok(null);
});
