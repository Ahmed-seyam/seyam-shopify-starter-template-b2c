/**
 * Registers the cache-invalidation webhooks against SITE_URL:
 *
 *   node --env-file=.env scripts/register-webhooks.mjs
 *
 * Requires SHOPIFY_ADMIN_TOKEN. SITE_URL must be publicly reachable
 * (use a tunnel like `cloudflared`/`ngrok` for local development).
 *
 * Note: webhooks created with a custom-app Admin token are signed with that
 * app's API secret key — set SHOPIFY_WEBHOOK_SECRET to it.
 */

// Tolerate a pasted URL — only the hostname is wanted.
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const siteUrl = process.env.SITE_URL;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-07";

if (!domain || !token || !siteUrl) {
  console.error("Set SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_TOKEN and SITE_URL in .env");
  process.exit(1);
}

const TOPICS = [
  "PRODUCTS_CREATE",
  "PRODUCTS_UPDATE",
  "PRODUCTS_DELETE",
  "COLLECTIONS_CREATE",
  "COLLECTIONS_UPDATE",
  "COLLECTIONS_DELETE",
];

const CREATE_MUTATION = /* GraphQL */ `
  mutation webhookSubscriptionCreate(
    $topic: WebhookSubscriptionTopic!
    $webhookSubscription: WebhookSubscriptionInput!
  ) {
    webhookSubscriptionCreate(
      topic: $topic
      webhookSubscription: $webhookSubscription
    ) {
      webhookSubscription {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

async function main() {
  const callbackUrl = `${siteUrl.replace(/\/$/, "")}/api/webhooks/shopify`;
  console.log(`Registering webhooks → ${callbackUrl}`);

  for (const topic of TOPICS) {
    const response = await fetch(
      `https://${domain}/admin/api/${apiVersion}/graphql.json`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({
          query: CREATE_MUTATION,
          variables: {
            topic,
            webhookSubscription: { callbackUrl, format: "JSON" },
          },
        }),
      },
    );
    const body = await response.json();
    const errors =
      body.data?.webhookSubscriptionCreate?.userErrors ?? body.errors ?? [];
    if (errors.length) {
      console.warn(`  ✗ ${topic}: ${errors.map((e) => e.message).join("; ")}`);
    } else {
      console.log(`  ✓ ${topic}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
