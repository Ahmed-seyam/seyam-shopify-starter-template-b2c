import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";
import { CUSTOMER_UPDATE_MUTATION } from "../_mutations/customer-update";
import { persistToken, type TokenPayload } from "../_shared";

type UpdateProfileBody = {
  firstName: string;
  lastName: string;
  email: string;
  password?: string;
  acceptsMarketing: boolean;
  locale?: string;
};

type UpdatePayload = {
  customer: { id: string } | null;
  customerAccessToken: { accessToken: string; expiresAt: string } | null;
  userErrors: TokenPayload["userErrors"];
};

/**
 * POST /api/account/update-profile (auth) — reached via the profile form action.
 * A ShopifyUserError is mapped to a translated message by the action. Email/
 * password changes rotate the token — the fresh one is persisted + propagated.
 */
export const POST = route(async (request) => {
  const { firstName, lastName, email, password, acceptsMarketing, locale } =
    (await request.json()) as UpdateProfileBody;

  const token = await getCustomerToken();
  if (!token) return ok(null);

  const rest = { firstName, lastName, email, acceptsMarketing };
  const payload = await storefrontMutation<UpdatePayload>(
    "customerUpdate",
    CUSTOMER_UPDATE_MUTATION,
    {
      variables: {
        customerAccessToken: token,
        customer: password ? { ...rest, password } : rest,
      },
      locale,
    },
  );
  if (payload.customerAccessToken) {
    await persistToken(payload.customerAccessToken);
  }

  return ok(null);
});
