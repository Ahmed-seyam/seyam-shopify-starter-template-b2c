// Type-only deep import: the barrel's ProductCard is the component.
import type { ProductCard } from "@/app/[locale]/products/_types";

export type SearchOptions = {
  locale: string;
  limit?: number;
};

/**
 * Port implemented by every search backend. `domains/search` ships the
 * native Shopify adapter; `domains/search-algolia` plugs in behind the same
 * interface. Selected via the SEARCH_PROVIDER env variable.
 */
export interface SearchProvider {
  /** Full search — powers the /search results page. */
  search(query: string, options: SearchOptions): Promise<ProductCard[]>;
  /** Fast typeahead suggestions. */
  suggest(query: string, options: SearchOptions): Promise<ProductCard[]>;
}
