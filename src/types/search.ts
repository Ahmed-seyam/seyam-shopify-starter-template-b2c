import type { ProductCard } from "@/types/product";
import type { CatalogParams } from "@/lib/client/catalog/params";

export type SearchOptions = {
  locale: string;
  limit?: number;
  /** Filters + sort from the URL (see @/lib/client/catalog/params) — full search only. */
  catalog?: CatalogParams;
};

/**
 * Port implemented by every search backend. `./shopify` ships the native
 * Shopify adapter; `./algolia` plugs in behind the same interface.
 * Selected via the SEARCH_PROVIDER env variable.
 */
export interface SearchProvider {
  /** Full search — powers the /search results page. */
  search(query: string, options: SearchOptions): Promise<ProductCard[]>;
  /** Fast typeahead suggestions. */
  suggest(query: string, options: SearchOptions): Promise<ProductCard[]>;
}
