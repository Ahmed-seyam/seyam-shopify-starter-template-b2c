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
   - `unauthenticated_read_product_listings` (products, variants, collections)
   - `unauthenticated_read_checkouts` + `unauthenticated_write_checkouts` (cart mutations — under "Checkouts")
   - `unauthenticated_read_customers` + `unauthenticated_write_customers` + `unauthenticated_read_customer_tags` (the `app/[locale]/account` login/register/recover/reset flows)
   - `unauthenticated_read_content` (the `app/[locale]/pages` pages)
   - `unauthenticated_read_metaobjects` (the metaobjects CMS)
3. **Configuration → Admin API** → check scopes: `read_products`, `write_products`, `write_content` (seed creates content Pages), `read_publications`, `write_publications` (seed + publish to channel). Add `read_metaobjects` **only if** you use the metaobjects CMS and want its webhooks — see the metaobjects note below. Note: online-store **Pages have no webhook topic** at all, so page edits are never webhook-invalidated (they rely on ISR TTL or `POST /api/revalidate`).
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
npm run seed            # ~30 demo products, all nav/footer collections + pages, published
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
| `embedded` | `app/[locale]/checkout` mounts Shopify **Checkout Kit**'s `<shopify-checkout>` overlay with that same URL, so the buyer stays on-site (no redirect). On completion it routes to `/checkout/thank-you`. |

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

## 7. Shopify admin checklist (everything that must be done in the dashboard)

The code is store-agnostic — these are the settings that live only in the
Shopify admin and that the app cannot create for you. Do them once per store.

### Required for the app to load & sell

- [ ] **Custom app created, installed, tokens copied** — §2 (Storefront + Admin
      scopes above). Without this every page throws the Zod env error.
- [ ] **Products exist and are published to the right channel.** `npm run seed`
      creates 6 demo products; if you add your own, make sure they're published
      to the sales channel your `SHOPIFY_STOREFRONT_TOKEN` reads (Online Store,
      or the **Headless** channel if you added it — §6). Unpublished products are
      invisible to the Storefront API *and* omitted from checkout.
- [ ] **Payments enabled — required to complete a checkout.**
      **Settings → Payments.** On a development store use **test mode**: either
      turn on Shopify Payments *test mode*, or add the **(for testing) Bogus
      Gateway**. Without a payment method the buyer can reach checkout but can't
      place an order. Bogus Gateway test cards: card number `1` = success,
      `2` = failure, `3` = exception.
- [ ] **Shipping rates configured — checkout blocks without them.**
      **Settings → Shipping and delivery.** The general profile needs at least
      one zone with one rate (a free "Standard" rate is fine) covering the
      countries in your markets, or checkout stops at the shipping step.

### Required for i18n (locale = `language-market` in the URL)

- [ ] **Markets** — **Settings → Markets.** Add the markets you want in the URL
      (`/en-us`, `/en-sa`, …); each pins a currency/region. `npm run sync-locales`
      reads these — the store's default market sorts first (`defaultLocale`).
- [ ] **Languages** — **Settings → Languages.** Publish each language you want in
      the URL. `sync-locales` reads these too; every published language needs a
      matching `messages/<code>.json` (missing ones fall back to English).
- Re-run `npm run sync-locales` after changing either.

### Customer accounts (`app/[locale]/account`)

- [ ] This template uses the **classic Storefront API** customer flows
      (`customerAccessTokenCreate`/`Create`/`Recover`/`Reset`), so it needs the
      `unauthenticated_*_customers` scopes above and a generated `SESSION_SECRET`
      in `.env` — **no** Customer Account API / OAuth app config. If unset, the
      account UI degrades to a "not configured" notice.
- [ ] **Redirect the Online Store to the app** — Shopify's emails link to the
      Online Store (password reset, "Visit our store", …). Install the bundled
      redirect theme so those links land on the app — no email template edits:
      `npm run install-redirect-theme -- --store <shop>.myshopify.com --storefront https://<your-site> --publish`
      (drop `--publish` to upload it unpublished and preview first). It sends
      `/account/reset/{id}/{token}` to `/account/reset?reset_url=…` and other
      pages to the same path on the app; gift card pages and account
      activation (invite emails) still render on Shopify.

### Going headless (optional — §6)

- [ ] Add the **Headless** sales channel (dedicated Storefront token + checkout).
- [ ] Publish products to that channel.
- [ ] Publish a **redirect theme** so the storefront bounces to your Next.js app.
- [ ] **Do NOT** password-protect the store — it blocks checkout too.

### Webhooks (cache invalidation — §4)

- [ ] `SITE_URL` set to a publicly reachable URL, `npm run register-webhooks` run
      once against it. Uses the **API secret key** (`shpss_…`) for HMAC — §2.

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
- **Checkout opens but I can't place the order / no shipping options** — the
  store has no payment method or no shipping rate. Enable test payments and add
  a shipping rate — §7 (Payments / Shipping).
- **Metaobject webhooks won't register** — two gotchas, in order:
  (1) *"You cannot create a webhook subscription with the specified topic"* → the
  app lacks the Admin `read_metaobjects` scope (add it, reinstall).
  (2) *"The specified filter is invalid…"* → metaobject webhooks can't be global;
  each needs a `filter: "type:<definition_type>"`. Populate `METAOBJECT_TYPES`
  in `scripts/register-webhooks.mjs` with your definition `type` handles — while
  it's empty (default) the script skips them cleanly.
- **`register-webhooks` and `PAGES_*`** — Shopify has no page webhook topic on
  any store; these are intentionally absent from the script.
