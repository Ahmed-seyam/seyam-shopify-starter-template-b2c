import "server-only";

// Search types + the provider-neutral index-sync hook for the webhook pipeline
// (no-ops unless SEARCH_PROVIDER=algolia). The actual search egress lives in
// Route Handlers: Shopify search under app/api/search, Algolia InstantSearch
// proxied through app/api/search/query.
export type * from "@/types/search";
export { syncSearchIndex } from "@/plugins/server/algolia/indexing";
