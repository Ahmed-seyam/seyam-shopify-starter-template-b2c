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
npm run sync-locales    # pull languages + markets from the store into routing
npm run dev
```

`sync-locales` regenerates `src/i18n/locales.generated.ts` from the store's
published languages (Settings → Languages) and markets (Settings → Markets) —
the URL structure (`/en-eg/…`) and the header switchers follow it. Re-run it
whenever those change. Each language needs a `messages/<code>.json`
(missing ones fall back to English).

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

## 5. Checkout mode (redirect vs. embedded)

`CHECKOUT_MODE` in `.env` controls where checkout is shown:

| Value | Behavior |
|---|---|
| `redirect` (default) | The Checkout button links to Shopify's hosted checkout (`cart.checkoutUrl`) — the buyer navigates to the `*.myshopify.com` checkout domain. |
| `embedded` | `domains/checkout` mounts Shopify **Checkout Kit**'s `<shopify-checkout>` overlay with that same URL, so the buyer stays on-site (no redirect). On completion it routes to `/checkout/thank-you`. |

Notes:
- **Customer prefill/attribution is identical in both modes** — it comes from the
  cart's `buyerIdentity.customerAccessToken`, not from the display mode. Signing
  in headlessly does not sign the user into checkout; the cart's buyerIdentity is
  the only channel that carries the customer into checkout.
- Checkout Kit is installed at `@shopify/checkout-kit@next` (currently an
  **alpha**). `redirect` is the safe default for client work; use `embedded` for
  demos and once the SDK is GA.
- Only `target="popup"` (on-page overlay), `_blank`, and `auto` exist — there is
  **no inline/iframe target**, and a raw `<iframe src={checkoutUrl}>` is blocked
  by Shopify's checkout `frame-ancestors` CSP. The overlay *is* the embed.
- A **prefilled address for a brand-new account** with no saved address is
  expected: Shopify's checkout remembers the last address typed **on that
  browser** (stored on the `*.myshopify.com` domain, per-browser — not tied to
  the account). Verify in an incognito window: the fields will be empty. Real
  customers on their own device see empty fields.

## 6. Lock the storefront to headless (disable the theme UI)

Serve **only** checkout from the `*.myshopify.com` domain and bounce every other
storefront URL to this Next.js app. Checkout is **not** rendered by the theme
(it's Shopify's own checkout system), so you can neutralize the theme without
breaking `checkoutUrl`.

**Do NOT use "Password protect your store"** (Online Store → Preferences). It
gates the *entire* online store **including checkout** — public buyers hit the
password wall instead of paying. It's a pre-launch tool only.

Instead:

1. **Add the Headless sales channel** (Settings → Apps and sales channels →
   Shopify App Store → "Headless"). It gives a first-class Storefront token +
   checkout independent of the Online Store theme. Point
   `SHOPIFY_STOREFRONT_TOKEN` at it if you use it.
2. **Publish products to the channel your Storefront token reads.** Disabling the
   theme is fine; *unpublishing products from the channel* is what would break
   checkout (`cartCreate`/`checkoutUrl` would omit them).
3. **Publish a redirect theme** as the live theme — either Shopify's official
   **"Headless"** theme (Theme Store) or a minimal one whose `layout/theme.liquid`
   redirects every request to your headless domain:

   ```liquid
   <!doctype html>
   <html>
     <head>
       <meta http-equiv="refresh" content="0; url=https://your-headless-domain.com{{ request.path }}">
       <script>location.replace("https://your-headless-domain.com" + location.pathname + location.search);</script>
     </head>
     <body></body>
   </html>
   ```

Result: `…myshopify.com/products/…` → redirected to your Next.js site;
`…myshopify.com/checkouts/…` (the `checkoutUrl`) → still works, since checkout
isn't a theme template.

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
