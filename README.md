# shopify-starter-b2c

A production-shaped **B2C Shopify storefront starter** — Next.js 16 (App
Router) + Tailwind v4 + shadcn/ui, organized as domain-driven vertical
slices, with tag-based ISR caching invalidated by Shopify webhooks,
Arabic/English with RTL, and pluggable search.

## Quick start

```bash
cp .env.example .env        # fill in your store domain + tokens
npm install
npm run seed                # demo products, collections + pages (needs Admin token)
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/en` (or `/ar`).

### What you need from Shopify

1. A store (a free [Partner development store](https://partners.shopify.com) works).
2. A **custom app** (Settings → Apps → Develop apps) with:
   - Storefront API enabled → `SHOPIFY_STOREFRONT_TOKEN`
   - Admin API scopes `write_products`, `read_products`, `write_content` → `SHOPIFY_ADMIN_TOKEN`
   - The app's **API secret key** → `SHOPIFY_WEBHOOK_SECRET`

## Architecture

The whole design rests on one invariant: **Shopify is reached exactly one way —
by calling our own `/api/*` Route Handlers.** See
[`ARCHITECTURE.md`](./ARCHITECTURE.md) for the full picture; the map below is the
tour.

```
src/
  app/
    [locale]/…            # en/ar routes (next-intl, RTL); domain code is
                          # co-located inside each route segment in private
                          # (_underscore) folders, so route files stand out:
      products/           #   page.tsx + _actions/ · _components/ · _types/ · index.ts
      collections/ cart/  #   _actions/ = server-only reads + "use server" mutations,
      account/            #     both calling callApi (never Shopify directly)
      pages/ search/      #   account/ nests wishlist/; search/ has an _algolia/ adapter
      checkout/           #   redirect or embedded (Checkout Kit)
    api/                  # the ONLY Shopify egress — one handler per operation:
      product/ cart/ …/   #   <domain>/<op>/route.ts (+ co-located query.ts)
      webhooks/shopify/   #   HMAC-verified cache invalidation + search sync
      revalidate/         #   manual escape hatch (Bearer REVALIDATION_SECRET)
      search/             #   query/suggestions + Insights (same-origin, rate-limited)
  hooks/                  # TanStack Query client islands (cart, search, wishlist)
  components/             # shared cross-route UI (catalog, home, layout, providers)
    ui/                   # owned, restylable shadcn kit (grouped by role)
  lib/                    # infra only — never fetches domain data
    server/api/           #   callApi transport + { data }/{ error } route contract
    server/cache/         #   tag vocabulary + webhook topic → tag map
    server/products/      #   raw → domain reshaping
    query/keys.ts         #   central TanStack query-key registry
  plugins/                # swappable adapters, selected by env
    server/shopify/       #   Storefront + Admin clients, session (server-only)
    server/algolia/       #   search egress + webhook index-sync
    server/security/      #   HMAC verification + rate limiting
    client/tracking/      #   GTM · CleverTap · Algolia Insights · UTM
  config/env.ts           # zod-validated, lazy (store-independent build)
  fragments/              # ALL GraphQL fragments (common, product, cart)
  types/ validation/      # domain types + zod schemas
  i18n/  proxy.ts         # next-intl config + Next 16 middleware (locale routing)
```

**Rules that keep it clean:**

- `storefrontFetch` / `storefrontMutation` (`plugins/server/shopify/client.ts`)
  are imported **only** by `app/api/` handlers. Pages/actions reach data via
  `callApi` (`lib/server/api/http.ts`) over that internal HTTP layer.
- Pages are adapters; they import from their segment's `index.ts` barrel only.
- `_actions/` hold both server-only **reads** (`import "server-only"`, for SSR)
  and Server Action **mutations** (`"use server"`, called from the client).
  Reshaping to domain types happens behind the API, so components never see
  Storefront API types.
- The browser makes **zero direct calls to Shopify**; all tokens are plain env
  vars (no `NEXT_PUBLIC_`), enforced by `server-only`.

## Caching & invalidation

- Product/collection/home pages are static (ISR) with **tagged fetches**:
  `products`, `product:<handle>`, `collections`, `collection:<handle>`.
- `POST /api/webhooks/shopify` verifies the HMAC against the raw body,
  dedupes by webhook ID, maps the topic to tags, and calls `revalidateTag`.
  Register the webhooks with `npm run register-webhooks` (SITE_URL must be
  publicly reachable — use a tunnel locally).
- Cart/search are runtime data (`no-store`) — never statically cached.
- Time-based revalidation (24 h) is the safety net for missed webhooks;
  `POST /api/revalidate` is the manual escape hatch.

## Search

`SEARCH_PROVIDER=shopify` (default) uses the native Storefront
search/predictive-search — zero dependencies. `SEARCH_PROVIDER=algolia`
switches to the Algolia adapter (REST, no SDK); the webhook pipeline then
also upserts/deletes index records, so cache and index stay consistent.
The Algolia `/search` page is InstantSearch-powered (facet counts, chips,
pagination) driven by the `searchFacets` config; all requests and Insights
events are proxied through `/api/search/*` — no Algolia key in the browser.

## Tracking

`src/plugins/client/tracking` — a `track.*` facade fanning out to every
configured vendor; unconfigured vendors no-op. Events: page_view, view_item,
add_to_cart, remove_from_cart, begin_checkout, purchase, search — plus UTM
first-touch capture merged into every GTM push.

| Env var | Enables |
| --- | --- |
| `NEXT_PUBLIC_GTM_ID` | Google Tag Manager (GA4 e-commerce dataLayer) |
| `NEXT_PUBLIC_CLEVERTAP_ACCOUNT_ID` (+ `_REGION`) | CleverTap (idle-loaded SDK) |
| `NEXT_PUBLIC_ENABLE_TRACKING=false` | Kill switch for all vendors |

Algolia Insights (click/conversion analytics) needs no extra config — it
activates with the Algolia search provider, relayed via `/api/search/events`.

## i18n

`next-intl` with `en` and `ar` (RTL). Locale-aware routes (`/en/…`, `/ar/…`),
`@inContext(country, language)` on every Storefront query for Shopify
Markets translations and currency. Add locales in `src/i18n/routing.ts` +
`messages/`.

## Deployment

**Vercel:** import the repo, set the env vars, done.

**Docker:**

```bash
docker compose up --build
```

The image is **store-independent** — no Shopify access at build time; all
config is runtime env vars, pages fill in via ISR on first request. Put a
reverse proxy in front for TLS.

### Scaling past one container

`revalidateTag` works out of the box on a single instance. For multiple
instances behind a load balancer, wire a shared cache handler (Redis) via
`cacheHandler` in `next.config.ts` and uncomment the `redis` service in
`docker-compose.yml`. See the Next.js self-hosting guide.

## Related templates

- `shopify-starter-b2b` — locked storefront, company accounts, contextual
  pricing (requires Shopify Plus in production; free on dev stores).
- `shopify-starter-b2b-b2c` — hybrid: guest B2C + B2B pricing on login.
