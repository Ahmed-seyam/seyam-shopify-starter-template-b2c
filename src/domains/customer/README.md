# customer domain

Reserved for customer accounts via the **Shopify Customer Account API**
(OAuth 2.0 / OpenID Connect). Planned shape, consistent with the other
domains:

```
customer/
  queries/     get-customer.ts, get-orders.ts        (server-only)
  mutations/   login.ts, logout.ts, update-address.ts ('use server')
  components/  account-menu.tsx, order-list.tsx
  types/
```

Notes for implementation:

- Use the Customer Account API, not legacy customer access tokens — it is
  also what B2B buyer context (`@inContext(buyer:)`) requires in the B2B fork.
- OAuth callback goes in `src/app/api/auth/callback/route.ts`.
- Store the session in httpOnly, secure, encrypted cookies (`jose`).
- Customer data is runtime data: never statically cached (`cache: "no-store"`).
