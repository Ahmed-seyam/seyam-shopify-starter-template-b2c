import "server-only";
import { env } from "@/app/core/config/env";
import { algoliaSearchProvider } from "@/app/[locale]/search/_algolia";
import { shopifySearchProvider } from "./_actions/shopify-provider";
import type { SearchProvider } from "./_types";

export function getSearchProvider(): SearchProvider {
  return env().SEARCH_PROVIDER === "algolia"
    ? algoliaSearchProvider
    : shopifySearchProvider;
}

export type * from "./_types";
