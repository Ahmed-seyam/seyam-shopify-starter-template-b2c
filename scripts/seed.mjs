/**
 * Seeds the dev store with demo products and a collection so a cloned
 * template becomes a working demo in one command:
 *
 *   node --env-file=.env scripts/seed.mjs
 *
 * Requires SHOPIFY_ADMIN_TOKEN with write_products scope.
 * Standalone on purpose — src/ code is server-only (Next.js runtime).
 */

// Tolerate a pasted URL — only the hostname is wanted.
const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, "")
  .replace(/\/.*$/, "");
const token = process.env.SHOPIFY_ADMIN_TOKEN;
const apiVersion = process.env.SHOPIFY_API_VERSION ?? "2025-07";

if (!domain || !token) {
  console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_TOKEN in .env");
  process.exit(1);
}

async function adminFetch(query, variables) {
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
  const body = await response.json();
  if (!response.ok || body.errors?.length) {
    throw new Error(JSON.stringify(body.errors ?? body, null, 2));
  }
  return body.data;
}

const DEMO_PRODUCTS = [
  { title: "Classic Cotton Tee", price: "350.00", options: ["S", "M", "L", "XL"] },
  { title: "Everyday Hoodie", price: "900.00", options: ["S", "M", "L"] },
  { title: "Canvas Tote Bag", price: "250.00" },
  { title: "Ceramic Coffee Mug", price: "180.00" },
  { title: "Minimalist Water Bottle", price: "420.00" },
  { title: "Linen Throw Blanket", price: "1200.00" },
];

const PRODUCT_SET_MUTATION = /* GraphQL */ `
  mutation productSet($input: ProductSetInput!) {
    productSet(input: $input, synchronous: true) {
      product {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const COLLECTION_CREATE_MUTATION = /* GraphQL */ `
  mutation collectionCreate($input: CollectionInput!) {
    collectionCreate(input: $input) {
      collection {
        id
        handle
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const PUBLICATIONS_QUERY = /* GraphQL */ `
  query publications {
    publications(first: 10) {
      edges {
        node {
          id
          name
        }
      }
    }
  }
`;

const PUBLISH_MUTATION = /* GraphQL */ `
  mutation publishablePublish($id: ID!, $input: [PublicationInput!]!) {
    publishablePublish(id: $id, input: $input) {
      userErrors {
        field
        message
      }
    }
  }
`;

async function main() {
  console.log(`Seeding ${domain}…`);

  const publications = await adminFetch(PUBLICATIONS_QUERY);
  const publicationIds = publications.publications.edges.map(
    (edge) => edge.node.id,
  );

  const productIds = [];
  for (const demo of DEMO_PRODUCTS) {
    const hasSizes = Boolean(demo.options);
    const input = {
      title: demo.title,
      status: "ACTIVE",
      productOptions: hasSizes
        ? [{ name: "Size", values: demo.options.map((name) => ({ name })) }]
        : undefined,
      variants: hasSizes
        ? demo.options.map((size) => ({
            price: demo.price,
            optionValues: [{ optionName: "Size", name: size }],
          }))
        : [{ price: demo.price, optionValues: [] }],
    };

    const data = await adminFetch(PRODUCT_SET_MUTATION, { input });
    const errors = data.productSet.userErrors;
    if (errors.length) {
      console.warn(`  ✗ ${demo.title}: ${errors.map((e) => e.message).join("; ")}`);
      continue;
    }
    productIds.push(data.productSet.product.id);
    console.log(`  ✓ ${demo.title} (${data.productSet.product.handle})`);
  }

  const collectionData = await adminFetch(COLLECTION_CREATE_MUTATION, {
    input: { title: "Featured", products: productIds },
  });
  const collectionErrors = collectionData.collectionCreate.userErrors;
  if (collectionErrors.length) {
    console.warn(
      `  ✗ Collection: ${collectionErrors.map((e) => e.message).join("; ")}`,
    );
  } else {
    console.log(
      `  ✓ Collection "Featured" (${collectionData.collectionCreate.collection.handle})`,
    );
  }

  // Publish everything to all sales channels (incl. Headless/Online Store)
  // so the Storefront API can see it.
  const publishInput = publicationIds.map((publicationId) => ({ publicationId }));
  const toPublish = [
    ...productIds,
    collectionData.collectionCreate.collection?.id,
  ].filter(Boolean);

  for (const id of toPublish) {
    const result = await adminFetch(PUBLISH_MUTATION, { id, input: publishInput });
    const errors = result.publishablePublish.userErrors;
    if (errors.length) {
      console.warn(`  ✗ publish ${id}: ${errors.map((e) => e.message).join("; ")}`);
    }
  }

  console.log("Done.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
