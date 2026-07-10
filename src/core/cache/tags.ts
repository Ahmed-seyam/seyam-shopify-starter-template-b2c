// Cache tag vocabulary. Tags are locale-agnostic — the fetch cache key
// already differs per locale (the request body includes @inContext variables),
// and invalidating a tag clears every locale variant at once.

export const TAGS = {
  products: "products",
  collections: "collections",
  pages: "pages",
} as const;

export const productTag = (handle: string) => `product:${handle}`;
export const collectionTag = (handle: string) => `collection:${handle}`;
export const pageTag = (handle: string) => `page:${handle}`;
