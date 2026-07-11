# customer domain

Customer accounts via the **Shopify Customer Account API** (OAuth 2.0 /
OIDC with PKCE). Implemented:

```
customer/
  queries/     GraphQL query documents (get-customer.ts, get-orders.ts)
  actions/     get-customer.ts, get-orders.ts (server-only; null/[] when
               signed out — pages never crash on missing auth)
  components/  order-list.tsx
  types/
```

Supporting pieces outside the domain:

- `core/shopify/customer-auth.ts` — OAuth endpoints, PKCE, encrypted JWE
  session (jose), transparent token refresh (rotated tokens re-persisted:
  persist-what-Shopify-returns, same rule as the cart cookie).
- `core/shopify/customer-client.ts` — `customerAccountFetch`; throws
  `CustomerAuthRequiredError` when signed out.
- `core/shopify/session.ts` — `SESSION.customer` cookie registry entry.
- Routes: `/api/auth/login`, `/api/auth/callback`, `/api/auth/logout`;
  UI at `/[locale]/account`.

Enable by setting `SHOPIFY_SHOP_ID`, `SHOPIFY_CUSTOMER_CLIENT_ID` and
`SESSION_SECRET` (see .env.example) and allow-listing
`${SITE_URL}/api/auth/callback` in the Customer Account API client.
Until then the account page shows a "not configured" notice.

Future mutations (update address, …): put the document in `mutations/`,
the Server Action in `actions/`, and check userErrors the same way the
cart does (`storefrontMutation` pattern; the Customer Account API client
would need the equivalent helper if mutations are added).

B2B fork note: buyer context (`@inContext(buyer:)`) builds on these same
tokens.
