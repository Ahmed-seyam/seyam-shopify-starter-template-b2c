# Setup

From zero to a working local demo in ~15 minutes.

## 1. Create a development store

1. Sign in at [partners.shopify.com](https://partners.shopify.com) (free account).
2. **Stores → Add store → Create development store.**
3. Purpose: *Test and build* — this unlocks Plus features (needed later for the B2B templates).
4. Skip demo data if asked — `npm run seed` provides it.

## 2. Create a custom app + tokens

In the store admin:

1. **Settings → Apps and sales channels → Develop apps → Create an app** (enable custom app development if prompted).
2. **Configuration → Storefront API** → enable. Check the scopes:
   - `unauthenticated_read_product_listings` (covers products, variants and collections)
   - `unauthenticated_write_checkouts` (cart mutations — under "Checkouts")
   - `unauthenticated_read_metaobjects` (optional — for the future content domain)
3. **Configuration → Admin API** → check scopes: `read_products`, `write_products`, `write_publications`.
4. **Install the app**, then collect from **API credentials**:

| `.env` variable | Where it is |
|---|---|
| `SHOPIFY_STORE_DOMAIN` | `your-store.myshopify.com` (no `https://`) |
| `SHOPIFY_STOREFRONT_TOKEN` | API credentials → Storefront API access token |
| `SHOPIFY_ADMIN_TOKEN` | API credentials → Admin API access token (shown **once**) |
| `SHOPIFY_WEBHOOK_SECRET` | API credentials → **API secret key** (`shpss_…`, in the "API key and secret key" section — NOT the `shpat_` admin token). Shopify signs every webhook with it; the handler verifies the HMAC against it. Signatures only match if the webhooks were registered by this same app — which `npm run register-webhooks` guarantees. |

One more secret doesn't come from Shopify — **you generate it yourself**:

| `.env` variable | What it is |
|---|---|
| `REVALIDATION_SECRET` | Protects your own `POST /api/revalidate` escape hatch. Generate: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |

## 3. Configure and run

```bash
cp .env.example .env    # paste the values above
npm install
npm run seed            # 6 demo products + "Featured" collection, published
npm run dev
```

Open http://localhost:3000/en — you should see the seeded products.
Check: PDP loads, size selector works, add to cart updates the badge,
cart page edits quantities, Checkout lands on Shopify checkout, and `/ar`
renders RTL.

## 4. Webhooks (cache invalidation) — optional locally

Shopify must reach your app, so tunnel first:

```bash
cloudflared tunnel --url http://localhost:3000   # or ngrok http 3000
```

Set `SITE_URL` in `.env` to the tunnel URL, restart dev, then:

```bash
npm run register-webhooks
```

Test: edit a product title in the admin → within seconds the change appears
on the storefront (watch the `[webhooks]` line in the dev console). In
production, deploy first, set `SITE_URL` to the real domain, and run the
same command once.

## Troubleshooting

- **Zod error mentioning SHOPIFY_STORE_DOMAIN on first page load** — `.env`
  missing or not loaded; restart `npm run dev` after editing it.
- **Seeded products don't show on the storefront** — publication scope was
  missing during seed. Add `write_publications`, re-run `npm run seed`.
- **Webhook returns 401** — `SHOPIFY_WEBHOOK_SECRET` must be the **API secret
  key** of the same app whose Admin token registered the webhooks.
- **Stale prices after edits** — webhooks not registered/reachable; use
  `POST /api/revalidate` with `Authorization: Bearer $REVALIDATION_SECRET`
  and body `{"tags":["products"]}` as a manual fallback.
