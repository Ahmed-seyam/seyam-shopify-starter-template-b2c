import { ok, route } from "@/lib/server/api/route";
import {
  ShopifyUserError,
  storefrontMutation,
  type UserError,
} from "@/plugins/server/shopify/client";
import { CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION } from "../_mutations/customer-access-token-create";
import { CUSTOMER_CREATE_MUTATION } from "../_mutations/customer-create";
import { persistToken, type TokenPayload } from "../_shared";

type RegisterBody = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  locale?: string;
};

type CreatePayload = {
  customer: { id: string } | null;
  userErrors: UserError[];
};

/**
 * POST /api/account/register — reached via the register form action. A failed
 * customerCreate propagates its ShopifyUserError (the action maps TAKEN etc.).
 * On success we auto sign-in; `signedIn` tells the action where to redirect.
 */
export const POST = route(async (request) => {
  const { email, password, firstName, lastName, locale } =
    (await request.json()) as RegisterBody;

  await storefrontMutation<CreatePayload>(
    "customerCreate",
    CUSTOMER_CREATE_MUTATION,
    {
      variables: {
        input: {
          email,
          password,
          ...(firstName ? { firstName } : {}),
          ...(lastName ? { lastName } : {}),
        },
      },
      locale,
    },
  );

  // Auto sign-in so the new customer lands on their account, not the login page.
  let signedIn = false;
  try {
    const payload = await storefrontMutation<TokenPayload>(
      "customerAccessTokenCreate",
      CUSTOMER_ACCESS_TOKEN_CREATE_MUTATION,
      { variables: { input: { email, password } }, locale },
    );
    if (payload.customerAccessToken) {
      await persistToken(payload.customerAccessToken);
      signedIn = true;
    }
  } catch (error) {
    if (!(error instanceof ShopifyUserError)) throw error;
    // Account exists but auto-login failed — action sends them to sign in.
  }

  return ok({ signedIn });
});
