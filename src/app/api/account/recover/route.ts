import { ok, route } from "@/lib/server/api/route";
import { ShopifyUserError, storefrontMutation } from "@/plugins/server/shopify/client";
import { CUSTOMER_RECOVER_MUTATION } from "../_mutations/customer-recover";

type RecoverBody = { email: string; locale?: string };

/**
 * POST /api/account/recover — reached via the recover form action. userErrors
 * are swallowed here: the response is deliberately identical whether or not the
 * email exists, so the form can't enumerate accounts.
 */
export const POST = route(async (request) => {
  const { email, locale } = (await request.json()) as RecoverBody;

  try {
    await storefrontMutation("customerRecover", CUSTOMER_RECOVER_MUTATION, {
      variables: { email },
      locale,
    });
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
  }

  return ok(null);
});
