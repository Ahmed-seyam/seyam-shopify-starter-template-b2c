import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION } from "../_mutations/customer-access-token-create";
import { persistToken, type TokenPayload } from "../_shared";

type LoginBody = { email: string; password: string; locale?: string };

/**
 * POST /api/account/login — reached via the login form action. Bad credentials
 * surface as a ShopifyUserError (revived + translated by the action). On success
 * the token cookie is set here and propagated back by callApi.
 */
export const POST = route(async (request) => {
  const { email, password, locale } = (await request.json()) as LoginBody;

  const payload = await storefrontMutation<TokenPayload>(
    "customerAccessTokenCreate",
    CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
    { variables: { input: { email, password } }, locale },
  );
  if (!payload.customerAccessToken) return ok({ authenticated: false });

  await persistToken(payload.customerAccessToken);
  return ok({ authenticated: true });
});
