import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { CUSTOMER_RESET_MUTATION } from "../_mutations/customer-reset";
import { persistToken, type TokenPayload } from "../_shared";

type ResetBody = {
  id: string;
  token: string;
  password: string;
  locale?: string;
};

/**
 * POST /api/account/reset — reached via the reset form action. An invalid
 * link surfaces as a ShopifyUserError (mapped by the action). On success the
 * token cookie is set here and propagated back by callApi.
 */
export const POST = route(async (request) => {
  const { id, token, password, locale } = (await request.json()) as ResetBody;

  const payload = await storefrontMutation<TokenPayload>(
    "customerReset",
    CUSTOMER_RESET_MUTATION,
    {
      variables: {
        id: `gid://shopify/Customer/${id}`,
        input: { resetToken: token, password },
      },
      locale,
    },
  );
  if (!payload.customerAccessToken) return ok({ authenticated: false });

  await persistToken(payload.customerAccessToken);
  return ok({ authenticated: true });
});
