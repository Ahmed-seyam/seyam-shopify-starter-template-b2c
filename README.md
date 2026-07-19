# shopify-starter-b2c

A production-shaped **B2C Shopify storefront starter** — Next.js 16 (App
Router) + Tailwind v4 + shadcn/ui, organized as domain-driven vertical
slices, with tag-based ISR caching invalidated by Shopify webhooks,
Arabic/English with RTL, and pluggable search.

## Quick start

```bash
cp .env.example .env        # fill in your store domain + tokens
npm install
npm run seed                # demo products + collection (needs Admin token)
npm run dev
```

Open http://localhost:3000 — you'll be redirected to `/en` (or `/ar`).

### What you need from Shopify

1. A store (a free [Partner development store](https://partners.shopify.com) works).
2. A **custom app** (Settings → Apps → Develop apps) with:
   - Storefront API enabled → `SHOPIFY_STOREFRONT_TOKEN`
   - Admin API scopes `write_products`, `read_products` → `SHOPIFY_ADMIN_TOKEN`
   - The app's **API secret key** → `SHOPIFY_WEBHOOK_SECRET`

## Architecture

```
src/
  app/
    [locale]/…            # en/ar routes (next-intl, RTL-ready); domain code
                          # is co-located inside each route segment in private
                          # (_underscore) folders, so route files stand out:
      products/           #   page.tsx + _queries/ · _actions/ · _components/ · _types/
      collections/ cart/  #   (_mutations/ = Server Actions)
      account/            #   customer auth + profile (wishlist/ nested inside)
      pages/              #   Shopify content pages
      search/             #   SearchProvider port + native adapter
        _algolia/         #   Algolia adapter behind the same port
    api/webhooks/shopify/ # HMAC-verified cache invalidation + search sync
    api/revalidate/       # manual escape hatch (Bearer REVALIDATION_SECRET)
    api/search/           # suggestions endpoint (same-origin + per-IP rate limit)
    fragments/            # ALL GraphQL fragments (common, product, cart)
  components/             # shared cross-route components (catalog, home, layout)
    ui/                   # shadcn/ui component kit (owned, restylable)
  lib/
    shopify/              # server-only Storefront + Admin clients
    cache/                # tag vocabulary + webhook topic → tag map
    security/             # HMAC verification
    config/               # env validation + nav config
```

**Rules that keep it clean:**

- Pages are adapters; they import from their segment's `index.ts` only.
- `_queries/` are server-only reads (`import "server-only"`) that map raw
  Shopify shapes to domain types — components never see Storefront API types.
- `_mutations/` are Server Actions (`"use server"`). Client components import
  them from the actions file directly (never through the barrel).
- The browser makes **zero direct calls to Shopify**; all tokens are plain
  env vars (no `NEXT_PUBLIC_`), enforced by `server-only`.

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

`src/lib/tracking` — a `track.*` facade fanning out to every configured
vendor; unconfigured vendors no-op. Events: page_view, view_item,
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
