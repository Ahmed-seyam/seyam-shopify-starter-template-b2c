import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { CUSTOMER_RESET_BY_URL_MUTATION } from "../_mutations/customer-reset";
import { persistToken, type TokenPayload } from "../_shared";

type ResetBody = {
  resetUrl: string;
  password: string;
  locale?: string;
};

/**
 * POST /api/account/reset — reached via the reset form action. An invalid or
 * expired link surfaces as a ShopifyUserError (mapped by the action). On
 * success the token cookie is set here and propagated back by callApi.
 */
export const POST = route(async (request) => {
  const { resetUrl, password, locale } = (await request.json()) as ResetBody;

  const payload = await storefrontMutation<TokenPayload>(
    "customerResetByUrl",
    CUSTOMER_RESET_BY_URL_MUTATION,
    { variables: { resetUrl, password }, locale },
  );
  if (!payload.customerAccessToken) return ok({ authenticated: false });

  await persistToken(payload.customerAccessToken);
  return ok({ authenticated: true });
});
