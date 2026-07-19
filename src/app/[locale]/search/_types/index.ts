// Type-only deep import: the barrel's ProductCard is the component.
import type { ProductCard } from "@/app/[locale]/products/_types";
import type { CatalogParams } from "@/components/catalog/catalog-params";

export type SearchOptions = {
  locale: string;
  limit?: number;
  /** Filters + sort from the URL (see catalog-params) — full search only. */
  catalog?: CatalogParams;
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
