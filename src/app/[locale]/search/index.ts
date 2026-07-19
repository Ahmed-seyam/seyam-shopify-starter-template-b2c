import "server-only";
import { env } from "@/app/core/config/env";
import { algoliaSearchProvider } from "@/app/[locale]/search/algolia";
import { shopifySearchProvider } from "./actions/shopify-provider";
import type { SearchProvider } from "./types";

export function getSearchProvider(): SearchProvider {
  return env().SEARCH_PROVIDER === "algolia"
    ? algoliaSearchProvider
    : shopifySearchProvider;
}

export type * from "./types";
