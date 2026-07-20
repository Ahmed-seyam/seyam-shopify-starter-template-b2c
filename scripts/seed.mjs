/**
 * Seeds the dev store with a full demo catalog — products, collections,
 * content pages and a gift-card product — so a freshly cloned template
 * becomes a working demo where every nav, footer and homepage link resolves:
 *
 *   node --env-file=.env scripts/seed.mjs
 *
 * Requires SHOPIFY_ADMIN_TOKEN with write_products + write_content scopes.
 * Idempotent: safe to re-run (existing products/collections/pages are reused).
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

const handleize = (title) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

// A deterministic product-photo URL Shopify can ingest via its async media
// pipeline (that pipeline follows picsum's redirect fine).
const image = (seed) => `https://picsum.photos/seed/${seed}/900/1125`;

// Collection images are fetched synchronously by a stricter importer that does
// NOT follow redirects, so picsum fails there ("corrupt image"). placehold.co
// serves the bytes directly and doubles as a labelled category tile.
const collectionImage = (title) =>
  `https://placehold.co/900x1125/2b2b2b/f5f2ec.png?text=${encodeURIComponent(title)}`;

const APPAREL_SIZES = ["XS", "S", "M", "L", "XL"];

/**
 * Collection metadata keyed by handle. Every handle referenced by the nav
 * (src/config/nav.ts), footer, hero and category grid lives here so their
 * links never 404. Product membership is derived from each product's
 * `collections` list below.
 */
const COLLECTIONS = {
  all: { title: "All Products", description: "The complete collection — every piece in the store." },
  "new-arrivals": { title: "New Arrivals", description: "The latest additions, fresh off the rail." },
  featured: { title: "Featured", description: "A hand-picked edit of this season's standouts." },
  outerwear: { title: "Outerwear", description: "Coats, jackets and vests built to layer." },
  coats: { title: "Coats", description: "Long-line silhouettes for colder days." },
  vests: { title: "Vests", description: "Lightweight warmth without the sleeves." },
  jackets: { title: "Jackets", description: "Everyday jackets, from denim to shearling." },
  wool: { title: "Wool", description: "Naturally insulating, made to last." },
  quilted: { title: "Quilted", description: "Padded warmth with a clean finish." },
  shearling: { title: "Shearling", description: "Plush-lined pieces for deep winter." },
  "regular-fit": { title: "Regular Fit", description: "Our classic, true-to-size cut." },
  "relaxed-fit": { title: "Relaxed Fit", description: "An easier, roomier silhouette." },
  knitwear: { title: "Knitwear", description: "Sweaters, cardigans and jumpers." },
  tops: { title: "Tops", description: "Shirts, tees and overshirts." },
  bottoms: { title: "Bottoms", description: "Trousers, chinos, denim and more." },
  accessories: { title: "Accessories", description: "The finishing touches." },
};

const VENDORS = ["Atelier North", "Meridian Supply", "Coastline", "Foundry & Field"];

/**
 * Demo catalogue. `collections` lists explicit memberships; "all" plus
 * new-arrivals/featured are appended automatically from the flags below.
 * Apparel gets Size variants (XS–XL); `oneSize` items use a single variant.
 */
const DEMO_PRODUCTS = [
  // — Outerwear · Coats —
  { title: "Wool Overcoat", type: "Outerwear", price: "4800.00", compareAt: "5600.00", collections: ["outerwear", "coats", "wool", "regular-fit"], featured: true, isNew: true, desc: "A tailored double-faced wool overcoat with a clean, timeless drape." },
  { title: "Longline Trench Coat", type: "Outerwear", price: "3900.00", collections: ["outerwear", "coats", "relaxed-fit"], desc: "Water-resistant cotton gabardine trench with a storm flap and belt." },
  { title: "Belted Wrap Coat", type: "Outerwear", price: "4200.00", collections: ["outerwear", "coats", "wool", "regular-fit"], isNew: true, desc: "A soft wool-blend wrap coat that cinches at the waist." },
  // — Outerwear · Jackets —
  { title: "Quilted Bomber Jacket", type: "Outerwear", price: "2600.00", compareAt: "3000.00", collections: ["outerwear", "jackets", "quilted", "regular-fit"], featured: true, desc: "Diamond-quilted bomber with a ribbed collar and hem." },
  { title: "Denim Trucker Jacket", type: "Outerwear", price: "1900.00", collections: ["outerwear", "jackets", "regular-fit"], desc: "Rigid selvedge denim trucker that breaks in beautifully." },
  { title: "Shearling Aviator Jacket", type: "Outerwear", price: "6500.00", collections: ["outerwear", "jackets", "shearling", "relaxed-fit"], featured: true, isNew: true, desc: "A statement aviator lined with genuine shearling." },
  { title: "Cotton Field Jacket", type: "Outerwear", price: "2200.00", collections: ["outerwear", "jackets", "regular-fit"], desc: "A utilitarian four-pocket field jacket in waxed cotton." },
  { title: "Shearling Chore Coat", type: "Outerwear", price: "4600.00", collections: ["outerwear", "jackets", "shearling", "relaxed-fit"], desc: "A workwear-inspired chore coat with a warm shearling collar." },
  // — Outerwear · Vests —
  { title: "Quilted Puffer Vest", type: "Outerwear", price: "1800.00", collections: ["outerwear", "vests", "quilted", "relaxed-fit"], isNew: true, desc: "A packable down-alternative vest for layered warmth." },
  { title: "Wool Gilet", type: "Outerwear", price: "1600.00", collections: ["outerwear", "vests", "wool", "regular-fit"], desc: "A refined wool-blend gilet that layers under a coat." },

  // — Knitwear —
  { title: "Merino Crew Sweater", type: "Knitwear", price: "1400.00", collections: ["knitwear", "wool", "regular-fit"], featured: true, desc: "Fine-gauge merino crewneck in a soft, breathable knit." },
  { title: "Cable-Knit Cardigan", type: "Knitwear", price: "1700.00", collections: ["knitwear", "wool", "relaxed-fit"], isNew: true, desc: "A chunky lambswool cardigan with horn buttons." },
  { title: "Turtleneck Jumper", type: "Knitwear", price: "1500.00", collections: ["knitwear", "regular-fit"], desc: "A ribbed roll-neck jumper in a cotton-wool blend." },
  { title: "Lambswool V-Neck", type: "Knitwear", price: "1300.00", collections: ["knitwear", "wool", "regular-fit"], desc: "A lightweight lambswool V-neck for easy layering." },

  // — Tops —
  { title: "Oxford Shirt", type: "Tops", price: "950.00", collections: ["tops", "regular-fit"], featured: true, desc: "The everyday button-down in soft washed oxford cotton." },
  { title: "Classic Cotton Tee", type: "Tops", price: "350.00", collections: ["tops", "regular-fit"], desc: "A heavyweight combed-cotton tee with a clean neckline." },
  { title: "Linen Shirt", type: "Tops", price: "1100.00", collections: ["tops", "relaxed-fit"], isNew: true, desc: "A breezy garment-dyed linen shirt for warmer days." },
  { title: "Flannel Overshirt", type: "Tops", price: "1250.00", collections: ["tops", "relaxed-fit"], desc: "A brushed-cotton overshirt that works as a light jacket." },
  { title: "Striped Long-Sleeve Tee", type: "Tops", price: "480.00", collections: ["tops", "regular-fit"], desc: "A Breton-striped long-sleeve in mid-weight jersey." },

  // — Bottoms —
  { title: "Slim Chinos", type: "Bottoms", price: "1100.00", collections: ["bottoms", "regular-fit"], featured: true, desc: "A slim-tapered chino in stretch-cotton twill." },
  { title: "Relaxed Denim Jeans", type: "Bottoms", price: "1350.00", collections: ["bottoms", "relaxed-fit"], isNew: true, desc: "Straight-leg jeans in a rigid, honest denim." },
  { title: "Wool Trousers", type: "Bottoms", price: "1600.00", collections: ["bottoms", "wool", "regular-fit"], desc: "Pleated wool trousers with a tailored break." },
  { title: "Cargo Pants", type: "Bottoms", price: "1250.00", collections: ["bottoms", "relaxed-fit"], desc: "Utility cargos in a durable ripstop cotton." },
  { title: "Corduroy Pants", type: "Bottoms", price: "1400.00", collections: ["bottoms", "regular-fit"], desc: "Fine-wale corduroy trousers with a straight leg." },

  // — Accessories (one-size) —
  { title: "Leather Belt", type: "Accessories", price: "650.00", oneSize: true, collections: ["accessories"], desc: "A full-grain leather belt with a brushed brass buckle." },
  { title: "Wool Beanie", type: "Accessories", price: "420.00", oneSize: true, collections: ["accessories", "wool"], isNew: true, desc: "A ribbed merino beanie with a folded cuff." },
  { title: "Cashmere Scarf", type: "Accessories", price: "980.00", oneSize: true, collections: ["accessories"], featured: true, desc: "A generously sized, brushed pure-cashmere scarf." },
  { title: "Canvas Tote Bag", type: "Accessories", price: "250.00", oneSize: true, collections: ["accessories"], desc: "A heavyweight cotton-canvas tote with reinforced handles." },
  { title: "Leather Gloves", type: "Accessories", price: "720.00", oneSize: true, collections: ["accessories"], desc: "Cashmere-lined leather gloves for cold commutes." },
  { title: "Ribbed Cotton Socks", type: "Accessories", price: "180.00", oneSize: true, collections: ["accessories"], desc: "A three-pack of ribbed organic-cotton socks." },
];

/**
 * A stand-in gift-card product. Shopify's true gift card is a special product
 * type, but the storefront's /gift-cards route only needs a product at the
 * `gift-card` handle (see GIFT_CARD_HANDLE), so a multi-denomination product
 * makes that page work in the demo.
 */
const GIFT_CARD = {
  title: "Gift Card",
  handle: "gift-card",
  type: "Gift Card",
  vendor: VENDORS[0],
  desc: "The perfect gift, in any amount. Delivered by email, never expires.",
  denominations: ["250.00", "500.00", "1000.00", "2000.00"],
};

const PAGES = [
  {
    handle: "about",
    title: "About Us",
    body: "<p>We make considered essentials designed to last — clothing built from honest materials, cut with a timeless eye, and priced without the markup. Founded on the belief that a smaller, better wardrobe beats a bigger one.</p><p>Every piece is developed in-house and produced with partners we know by name.</p>",
  },
  {
    handle: "contact",
    title: "Contact",
    body: "<p>We'd love to hear from you.</p><ul><li><strong>Email:</strong> hello@example.com</li><li><strong>Phone:</strong> +20 100 000 0000</li><li><strong>Hours:</strong> Sunday–Thursday, 9am–6pm</li></ul><p>Our team typically replies within one business day.</p>",
  },
  {
    handle: "faq",
    title: "Frequently Asked Questions",
    body: "<h2>How long does shipping take?</h2><p>Standard delivery is 3–5 business days. Express options are shown at checkout.</p><h2>What is your return policy?</h2><p>Unworn items may be returned within 30 days for a full refund.</p><h2>Do you ship internationally?</h2><p>Yes — international rates and duties are calculated at checkout.</p><h2>How do I track my order?</h2><p>You'll receive a tracking link by email once your order ships.</p>",
  },
  {
    handle: "shipping-returns",
    title: "Shipping & Returns",
    body: "<h2>Shipping</h2><p>Orders are dispatched within 1–2 business days. Standard delivery arrives in 3–5 business days; express in 1–2. Shipping is free on orders over 2,000 EGP.</p><h2>Returns</h2><p>Return any unworn item within 30 days for a full refund. Items must be in original condition with tags attached. Start a return from your account's order history.</p>",
  },
  {
    handle: "size-guide",
    title: "Size Guide",
    body: "<p>Measurements are body measurements in centimetres. If you're between sizes, we recommend sizing up for a relaxed fit.</p><table><thead><tr><th>Size</th><th>Chest</th><th>Waist</th></tr></thead><tbody><tr><td>XS</td><td>86–91</td><td>71–76</td></tr><tr><td>S</td><td>91–96</td><td>76–81</td></tr><tr><td>M</td><td>96–101</td><td>81–86</td></tr><tr><td>L</td><td>101–106</td><td>86–91</td></tr><tr><td>XL</td><td>106–111</td><td>91–96</td></tr></tbody></table>",
  },
  {
    handle: "privacy-policy",
    title: "Privacy Policy",
    body: "<p>We collect only the information needed to process your orders and improve your experience. We never sell your personal data. You can request access to, or deletion of, your data at any time by contacting us.</p><p>This is placeholder policy text for the demo store — replace it with your own before going live.</p>",
  },
  {
    handle: "terms-of-service",
    title: "Terms of Service",
    body: "<p>By using this store you agree to our terms of sale and use. All content and product imagery is for demonstration purposes. Prices and availability are subject to change without notice.</p><p>This is placeholder terms text for the demo store — replace it with your own before going live.</p>",
  },
];

// ————————————————————————————————————————————————————————————————
// GraphQL documents
// ————————————————————————————————————————————————————————————————

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

const FIND_PRODUCT_QUERY = /* GraphQL */ `
  query findProduct($query: String!) {
    products(first: 1, query: $query) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const COLLECTION_ADD_MUTATION = /* GraphQL */ `
  mutation collectionAddProducts($id: ID!, $productIds: [ID!]!) {
    collectionAddProductsV2(id: $id, productIds: $productIds) {
      job {
        id
      }
      userErrors {
        field
        message
      }
    }
  }
`;

const FIND_COLLECTION_QUERY = /* GraphQL */ `
  query findCollection($query: String!) {
    collections(first: 1, query: $query) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const FIND_PAGE_QUERY = /* GraphQL */ `
  query findPage($query: String!) {
    pages(first: 1, query: $query) {
      edges {
        node {
          id
        }
      }
    }
  }
`;

const PAGE_CREATE_MUTATION = /* GraphQL */ `
  mutation pageCreate($page: PageCreateInput!) {
    pageCreate(page: $page) {
      page {
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

// ————————————————————————————————————————————————————————————————
// Seeding steps
// ————————————————————————————————————————————————————————————————

/** Get-or-create a product; returns its id, or null on failure. */
async function upsertProduct({ title, handle, input }) {
  const existing = await adminFetch(FIND_PRODUCT_QUERY, {
    query: `handle:${handle}`,
  });
  const found = existing.products.edges[0]?.node;
  if (found) {
    console.log(`  – ${title} already exists, skipping`);
    return found.id;
  }

  const data = await adminFetch(PRODUCT_SET_MUTATION, { input });
  const errors = data.productSet.userErrors;
  if (errors.length) {
    console.warn(`  ✗ ${title}: ${errors.map((e) => e.message).join("; ")}`);
    return null;
  }
  console.log(`  ✓ ${title} (${data.productSet.product.handle})`);
  return data.productSet.product.id;
}

/** Build a ProductSetInput for an apparel/accessory demo product. */
function buildProductInput(demo, index) {
  const handle = handleize(demo.title);
  const values = demo.oneSize ? ["Default Title"] : APPAREL_SIZES;
  const optionName = demo.oneSize ? "Title" : "Size";
  const tags = [
    ...(demo.collections ?? []),
    ...(demo.isNew ? ["new-arrivals"] : []),
    ...(demo.featured ? ["featured"] : []),
  ];

  return {
    handle,
    input: {
      title: demo.title,
      handle,
      status: "ACTIVE",
      descriptionHtml: `<p>${demo.desc}</p>`,
      vendor: VENDORS[index % VENDORS.length],
      productType: demo.type,
      tags,
      files: [{ originalSource: image(handle), contentType: "IMAGE", alt: demo.title }],
      productOptions: [
        { name: optionName, values: values.map((name) => ({ name })) },
      ],
      variants: values.map((value) => ({
        price: demo.price,
        ...(demo.compareAt ? { compareAtPrice: demo.compareAt } : {}),
        optionValues: [{ optionName, name: value }],
      })),
    },
  };
}

/** Get-or-create a collection by handle; returns its id, or null. */
async function upsertCollection(handle, meta) {
  const existing = await adminFetch(FIND_COLLECTION_QUERY, {
    query: `handle:${handle}`,
  });
  const found = existing.collections.edges[0]?.node;
  if (found) {
    console.log(`  – Collection "${meta.title}" already exists`);
    return found.id;
  }

  const data = await adminFetch(COLLECTION_CREATE_MUTATION, {
    input: {
      title: meta.title,
      handle,
      descriptionHtml: `<p>${meta.description}</p>`,
      image: { src: collectionImage(meta.title) },
    },
  });
  const errors = data.collectionCreate.userErrors;
  if (errors.length) {
    console.warn(`  ✗ Collection ${handle}: ${errors.map((e) => e.message).join("; ")}`);
    return null;
  }
  console.log(`  ✓ Collection "${meta.title}" (${data.collectionCreate.collection.handle})`);
  return data.collectionCreate.collection.id;
}

/** Get-or-create a content page by handle. */
async function upsertPage(page) {
  const existing = await adminFetch(FIND_PAGE_QUERY, {
    query: `handle:${page.handle}`,
  });
  if (existing.pages.edges[0]?.node) {
    console.log(`  – Page "${page.title}" already exists, skipping`);
    return;
  }

  const data = await adminFetch(PAGE_CREATE_MUTATION, {
    page: {
      title: page.title,
      handle: page.handle,
      body: page.body,
      isPublished: true,
    },
  });
  const errors = data.pageCreate.userErrors;
  if (errors.length) {
    console.warn(`  ✗ Page ${page.handle}: ${errors.map((e) => e.message).join("; ")}`);
    return;
  }
  console.log(`  ✓ Page "${page.title}" (/${data.pageCreate.page.handle})`);
}

/** True when an Admin API error is a missing-scope (ACCESS_DENIED) error. */
const isAccessDenied = (error) => /ACCESS_DENIED|Access denied/.test(String(error?.message));

async function main() {
  console.log(`Seeding ${domain}…`);

  const publications = await adminFetch(PUBLICATIONS_QUERY);
  const publicationIds = publications.publications.edges.map((edge) => edge.node.id);
  const publishInput = publicationIds.map((publicationId) => ({ publicationId }));

  // 1. Products — collect each product's id and the collections it belongs to.
  console.log("\nProducts:");
  const productIds = [];
  const membership = new Map(); // collection handle -> [productId]
  const addMembership = (handle, id) => {
    if (!membership.has(handle)) membership.set(handle, []);
    membership.get(handle).push(id);
  };

  for (const [index, demo] of DEMO_PRODUCTS.entries()) {
    const { handle, input } = buildProductInput(demo, index);
    const id = await upsertProduct({ title: demo.title, handle, input });
    if (!id) continue;
    productIds.push(id);

    const handles = new Set([
      "all",
      ...(demo.collections ?? []),
      ...(demo.isNew ? ["new-arrivals"] : []),
      ...(demo.featured ? ["featured"] : []),
    ]);
    for (const h of handles) addMembership(h, id);
  }

  // 1b. Gift-card product (its own handle; the /gift-cards route needs it).
  console.log("\nGift card:");
  const giftValues = GIFT_CARD.denominations;
  const giftId = await upsertProduct({
    title: GIFT_CARD.title,
    handle: GIFT_CARD.handle,
    input: {
      title: GIFT_CARD.title,
      handle: GIFT_CARD.handle,
      status: "ACTIVE",
      descriptionHtml: `<p>${GIFT_CARD.desc}</p>`,
      vendor: GIFT_CARD.vendor,
      productType: GIFT_CARD.type,
      tags: ["gift-card"],
      files: [{ originalSource: image("gift-card"), contentType: "IMAGE", alt: GIFT_CARD.title }],
      productOptions: [
        { name: "Denomination", values: giftValues.map((name) => ({ name })) },
      ],
      variants: giftValues.map((value) => ({
        price: value,
        optionValues: [{ optionName: "Denomination", name: value }],
      })),
    },
  });
  if (giftId) productIds.push(giftId);

  // 2. Collections — get-or-create each, then add its members.
  console.log("\nCollections:");
  const collectionIds = [];
  for (const [handle, meta] of Object.entries(COLLECTIONS)) {
    const id = await upsertCollection(handle, meta);
    if (!id) continue;
    collectionIds.push(id);

    const members = membership.get(handle) ?? [];
    if (members.length) {
      const addData = await adminFetch(COLLECTION_ADD_MUTATION, {
        id,
        productIds: members,
      });
      const addErrors = addData.collectionAddProductsV2.userErrors;
      if (addErrors.length) {
        console.warn(`  ✗ add to ${handle}: ${addErrors.map((e) => e.message).join("; ")}`);
      } else {
        console.log(`    → ${members.length} product(s) added to "${meta.title}"`);
      }
    }
  }

  // 3. Content pages (footer + nav links). Requires the write_content scope;
  //    without it the rest of the seed still succeeds.
  console.log("\nPages:");
  try {
    for (const page of PAGES) {
      await upsertPage(page);
    }
  } catch (error) {
    if (isAccessDenied(error)) {
      console.warn(
        "  ✗ Skipping pages — the Admin token is missing the `write_content` scope.\n" +
          "    Add it (Configuration → Admin API), reinstall the app, and re-run to seed:\n" +
          `    ${PAGES.map((p) => `/pages/${p.handle}`).join(", ")}`,
      );
    } else {
      throw error;
    }
  }

  // 4. Publish products + collections to every sales channel (incl.
  //    Headless/Online Store) so the Storefront API can see them.
  console.log("\nPublishing to sales channels…");
  const toPublish = [...productIds, ...collectionIds].filter(Boolean);
  for (const id of toPublish) {
    const result = await adminFetch(PUBLISH_MUTATION, { id, input: publishInput });
    const errors = result.publishablePublish.userErrors;
    if (errors.length) {
      console.warn(`  ✗ publish ${id}: ${errors.map((e) => e.message).join("; ")}`);
    }
  }
  console.log(`  ✓ published ${toPublish.length} item(s)`);

  console.log("\nDone.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
