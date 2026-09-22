# customer domain

Customer accounts via the **classic Shopify Storefront API** (email/password,
`customerAccessTokenCreate`). Login, registration, password recovery and reset
are **in-app pages** — the storefront owns the UI, no redirect to Shopify.

All Shopify egress goes through HTTP Route Handlers under `app/api/account/`
(the only code that imports `lib/shopify/client`). The `_actions` below call
those endpoints via `callApi` (`lib/api/http`) — they never touch Shopify
directly. See the [API HTTP layer](../../../../lib/api) for the contract.

```
app/api/account/            Route Handlers (the only Shopify callers)
  _queries/    GraphQL query documents (get-customer.ts, get-orders.ts, …)
  _mutations/  GraphQL mutation documents (customer-access-token-create.ts,
               customer-create.ts, customer-recover.ts, customer-reset.ts,
               customer-access-token-delete.ts, customer-address.ts,
               customer-update.ts). customerUserErrors is aliased to
               `userErrors` so storefrontMutation handles them.
  _shared.ts   TokenPayload + persistToken (saves the JWE cookie in-handler;
               callApi propagates the Set-Cookie back to the browser).
  login/ logout/ register/ recover/ reset/ update-profile/
  address/{save,delete,set-default}/   POST mutations
  customer/ orders/ order/ addresses/  GET reads

customer/ (this segment)
  _actions/    login / register / recover / reset / logout ('use server' form
               actions — own validation, translations, redirect); get-customer
               / get-orders / get-order / get-addresses (server-only read
               wrappers; null/[] when signed out). All call the /api routes.
               Validation schemas come from @/validation/{auth,account};
               safeLocale (redirect-target validation) from @/app/[locale]/_utils.
  _components/ login/register/recover/reset forms (useActionState),
               auth-layout.tsx (card shell), order-list.tsx
  _types/      domain types + AuthState (client-safe; forms import from here)
```

Supporting piece outside the domain:

- `core/shopify/customer-session.ts` — encrypts the access token in a JWE
  cookie (`__Host-customerSession` in production), bounded to the token's
  expiry. Reads never write cookies (safe in RSC render); the token is only
  written from Server Actions. No silent renew-on-render.

Pages: `/[locale]/account` (profile + orders + sign-out), `/account/login`,
`/account/register`, `/account/recover`, `/account/reset?reset_url=…`.

Enable by setting `SESSION_SECRET` (≥ 32 chars) in `.env` — the classic
Storefront API needs no other credentials. Until then the account pages show a
"not configured" notice. In **Settings → Notifications → Customer account
password reset**, point the reset link at
`${SITE_URL}/account/reset?reset_url={{ customer.reset_password_url | url_encode }}`
— the page forwards that URL to `customerResetByUrl`, which signs the customer in.

Future mutations: add a Route Handler under `app/api/account/` (GraphQL in
`_mutations/`, `storefrontMutation` in the handler), then a thin `_actions`
wrapper that calls it via `callApi` and maps the revived `ShopifyUserError`.

**B2B fork note:** this classic token CANNOT carry buyer context. Shopify's
`BuyerInput.customerAccessToken` for `@inContext(buyer:)` requires a **Customer
Account API** (OAuth) token, so the B2B fork replaces this whole auth layer
(customer-session + mutations + actions + pages) with the Customer Account API
OAuth flow. The `queries/` reads and `components/order-list.tsx` largely carry
over.
