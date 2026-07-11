# customer domain

Customer accounts via the **classic Shopify Storefront API** (email/password,
`customerAccessTokenCreate`). Login, registration, password recovery and reset
are **in-app pages** — the storefront owns the UI, no redirect to Shopify.

```
customer/
  queries/     GraphQL query documents (get-customer.ts, get-orders.ts)
  mutations/   GraphQL mutation documents (customer-access-token-create.ts,
               customer-create.ts, customer-recover.ts, customer-reset.ts,
               customer-access-token-delete.ts). customerUserErrors is
               aliased to `userErrors` so storefrontMutation handles them.
  actions/     login / register / recover / reset / logout ('use server'),
               get-customer / get-orders (server-only reads; null/[] when
               signed out — pages never crash on missing auth). shared.ts
               holds safeLocale (redirect-target validation) + persistToken.
  components/  login/register/recover/reset forms (useActionState),
               auth-layout.tsx (card shell), order-list.tsx
  types/       domain types + AuthState (client-safe; forms import from here)
```

Supporting piece outside the domain:

- `core/shopify/customer-session.ts` — encrypts the access token in a JWE
  cookie (`__Host-customerSession` in production), bounded to the token's
  expiry. Reads never write cookies (safe in RSC render); the token is only
  written from Server Actions. No silent renew-on-render.

Pages: `/[locale]/account` (profile + orders + sign-out), `/account/login`,
`/account/register`, `/account/recover`, `/account/reset/[id]/[token]`.

Enable by setting `SESSION_SECRET` (≥ 32 chars) in `.env` — the classic
Storefront API needs no other credentials. Until then the account pages show a
"not configured" notice. Point Shopify's customer "reset password" notification
at `${SITE_URL}/account/reset/{{ customer.id }}/{{ token }}` for the reset link.

Future mutations (update address, …): document in `mutations/`, Server Action
in `actions/`, and check userErrors the same way (`storefrontMutation`).

**B2B fork note:** this classic token CANNOT carry buyer context. Shopify's
`BuyerInput.customerAccessToken` for `@inContext(buyer:)` requires a **Customer
Account API** (OAuth) token, so the B2B fork replaces this whole auth layer
(customer-session + mutations + actions + pages) with the Customer Account API
OAuth flow. The `queries/` reads and `components/order-list.tsx` largely carry
over.
