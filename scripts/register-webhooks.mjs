/**
 * Registers the cache-invalidation webhooks against SITE_URL:
 *
 *   node --env-file=.env scripts/register-webhooks.mjs
 *
 * Idempotent: re-running skips subscriptions already pointing at this
 * callback, updates ones whose URL changed (e.g. SITE_URL changed), and
 * removes duplicates left by earlier runs.
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

// Resource-level topics — subscribed globally (no filter).
const RESOURCE_TOPICS = [
  "PRODUCTS_CREATE",
  "PRODUCTS_UPDATE",
  "PRODUCTS_DELETE",
  "COLLECTIONS_CREATE",
  "COLLECTIONS_UPDATE",
  "COLLECTIONS_DELETE",
  // NOTE: online-store Pages have NO webhook topic in the Admin API (the
  // WebhookSubscriptionTopic enum contains no PAGE* value). Page-content
  // changes can't be webhook-invalidated — they rely on ISR TTL or the
  // manual POST /api/revalidate escape hatch.
];

// Metaobject definition `type` handles whose changes should invalidate cache.
// Metaobject webhooks CANNOT be subscribed globally — Shopify requires a
// `filter: "type:<definition_type>"` naming one definition per subscription
// (and the app needs the Admin `read_metaobjects` scope). List the types your
// content-domain CMS uses here; leave empty until the CMS has definitions.
//   e.g. ["home_hero", "faq_item"]
const METAOBJECT_TYPES = [];
const METAOBJECT_TOPICS = [
  "METAOBJECTS_CREATE",
  "METAOBJECTS_UPDATE",
  "METAOBJECTS_DELETE",
];

/** Flat list of { topic, filter, label } subscription specs to reconcile. */
const SPECS = [
  ...RESOURCE_TOPICS.map((topic) => ({ topic, filter: null, label: topic })),
  ...METAOBJECT_TYPES.flatMap((type) =>
    METAOBJECT_TOPICS.map((topic) => ({
      topic,
      filter: `type:${type}`,
      label: `${topic} [${type}]`,
    })),
  ),
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

const UPDATE_MUTATION = /* GraphQL */ `
  mutation webhookSubscriptionUpdate(
    $id: ID!
    $webhookSubscription: WebhookSubscriptionInput!
  ) {
    webhookSubscriptionUpdate(
      id: $id
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

const DELETE_MUTATION = /* GraphQL */ `
  mutation webhookSubscriptionDelete($id: ID!) {
    webhookSubscriptionDelete(id: $id) {
      deletedWebhookSubscriptionId
      userErrors {
        field
        message
      }
    }
  }
`;

// Paginated so a store with many existing subscriptions is fully covered.
const LIST_QUERY = /* GraphQL */ `
  query webhookSubscriptions($cursor: String) {
    webhookSubscriptions(first: 100, after: $cursor) {
      edges {
        node {
          id
          topic
          filter
          endpoint {
            __typename
            ... on WebhookHttpEndpoint {
              callbackUrl
            }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

async function graphql(query, variables) {
  const response = await fetch(
    `https://${domain}/admin/api/${apiVersion}/graphql.json`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Access-Token": token,
      },
      body: JSON.stringify({ query, variables }),
    },
  );
  return response.json();
}

/**
 * Existing HTTP subscriptions keyed by topic → array of { id, callbackUrl,
 * filter }. A topic can hold several (different filters / URLs), so the value
 * is a list, not a single entry.
 */
async function fetchExisting() {
  const byTopic = new Map();
  let cursor = null;
  do {
    const body = await graphql(LIST_QUERY, { cursor });
    const conn = body.data?.webhookSubscriptions;
    if (!conn) {
      throw new Error(
        `Could not list webhooks: ${JSON.stringify(body.errors ?? body)}`,
      );
    }
    for (const { node } of conn.edges) {
      if (node.endpoint?.__typename === "WebhookHttpEndpoint") {
        const list = byTopic.get(node.topic) ?? [];
        list.push({
          id: node.id,
          callbackUrl: node.endpoint.callbackUrl,
          filter: node.filter ?? null,
        });
        byTopic.set(node.topic, list);
      }
    }
    cursor = conn.pageInfo.hasNextPage ? conn.pageInfo.endCursor : null;
  } while (cursor);
  return byTopic;
}

async function main() {
  const callbackUrl = `${siteUrl.replace(/\/$/, "")}/api/webhooks/shopify`;
  console.log(`Registering webhooks → ${callbackUrl}`);
  if (METAOBJECT_TYPES.length === 0) {
    console.log(
      "  (metaobject webhooks skipped — set METAOBJECT_TYPES to enable)",
    );
  }

  const existing = await fetchExisting();

  for (const { topic, filter, label } of SPECS) {
    const subs = existing.get(topic) ?? [];

    // A subscription matches this spec only if BOTH the callback and the filter
    // line up (a topic can carry several filtered subscriptions).
    const mine = subs.filter(
      (s) => s.callbackUrl === callbackUrl && s.filter === filter,
    );

    // Delete duplicates of this exact spec left by earlier runs (they'd
    // double-fire). Keep the first; leave other URLs/filters untouched.
    for (const dup of mine.slice(1)) {
      const del = await graphql(DELETE_MUTATION, { id: dup.id });
      const delErrors =
        del.data?.webhookSubscriptionDelete?.userErrors ?? del.errors ?? [];
      if (delErrors.length) {
        console.warn(
          `  ! ${label}: could not remove duplicate: ${delErrors.map((e) => e.message).join("; ")}`,
        );
      } else {
        console.log(`  - ${label} (removed duplicate)`);
      }
    }

    // Already registered exactly as desired — idempotent no-op.
    if (mine[0]) {
      console.log(`  = ${label} (already registered)`);
      continue;
    }

    // A same-topic+filter subscription on a different URL (e.g. SITE_URL
    // changed) can be updated in place instead of creating a duplicate.
    const stale = subs.find((s) => s.filter === filter);
    const subscriptionInput = { callbackUrl, format: "JSON" };
    if (filter) subscriptionInput.filter = filter;

    const [mutation, variables, resultKey] = stale
      ? [
          UPDATE_MUTATION,
          { id: stale.id, webhookSubscription: subscriptionInput },
          "webhookSubscriptionUpdate",
        ]
      : [
          CREATE_MUTATION,
          { topic, webhookSubscription: subscriptionInput },
          "webhookSubscriptionCreate",
        ];

    const body = await graphql(mutation, variables);
    const errors = body.data?.[resultKey]?.userErrors ?? body.errors ?? [];
    if (errors.length) {
      console.warn(`  ✗ ${label}: ${errors.map((e) => e.message).join("; ")}`);
    } else {
      console.log(`  ${stale ? "↻" : "✓"} ${label}`);
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
