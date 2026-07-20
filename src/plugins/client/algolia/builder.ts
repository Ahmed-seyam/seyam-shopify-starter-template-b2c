import type { CatalogParams, SortValue } from "@/lib/client/catalog/params";
import type { ProductCard } from "@/types/product";

/**
 * Composable builder for Algolia search params. Chain filters onto it and
 * spread `.build()` into the request body:
 *
 *   const params = algoliaQuery()
 *     .numeric("price", ">=", 20)
 *     .facet("availableForSale", true)
 *     .facetAny("vendor", ["Nike", "Adidas"]) // OR group
 *     .param("attributesToRetrieve", ["title", "handle"]) // any raw param
 *     .build();
 *
 * `catalogQuery(catalog)` pre-loads it with the shared URL filter contract
 * (price range, in-stock) — extend the returned builder with your own facets.
 */

export type NumericOperator = "<" | "<=" | "=" | "!=" | ">=" | ">";

export class AlgoliaQueryBuilder {
  private numericFilters: string[] = [];
  private facetFilters: (string | string[])[] = [];
  private extraParams: Record<string, unknown> = {};

  /** Range/equality filter on a numeric attribute. */
  numeric(attribute: string, operator: NumericOperator, value: number): this {
    this.numericFilters.push(`${attribute} ${operator} ${value}`);
    return this;
  }

  /** Facet the results on attribute:value (ANDed with other filters). */
  facet(attribute: string, value: string | number | boolean): this {
    this.facetFilters.push(`${attribute}:${value}`);
    return this;
  }

  /** Match any of the given values for one attribute (OR group). */
  facetAny(attribute: string, values: Array<string | number | boolean>): this {
    if (values.length > 0)
      this.facetFilters.push(values.map((value) => `${attribute}:${value}`));
    return this;
  }

  /** Escape hatch for any other Algolia search parameter. */
  param(key: string, value: unknown): this {
    this.extraParams[key] = value;
    return this;
  }

  /** Request-body params — spread into the /query POST body. */
  build(): Record<string, unknown> {
    return {
      ...(this.numericFilters.length > 0
        ? { numericFilters: this.numericFilters }
        : {}),
      ...(this.facetFilters.length > 0
        ? { facetFilters: this.facetFilters }
        : {}),
      ...this.extraParams,
    };
  }
}

/** Fresh empty builder. */
export function algoliaQuery(): AlgoliaQueryBuilder {
  return new AlgoliaQueryBuilder();
}

/**
 * Builder pre-loaded from the shared catalog URL contract (see
 * @/lib/client/catalog/params): price range → numeric `price` field
 * (indexed by ./indexing.ts), in-stock → availableForSale facet (list it in
 * the index's attributesForFaceting). Chain more filters onto the result.
 */
export function catalogQuery(catalog?: CatalogParams): AlgoliaQueryBuilder {
  const builder = algoliaQuery();
  if (!catalog) return builder;

  if (catalog.priceMin !== undefined)
    builder.numeric("price", ">=", catalog.priceMin);
  if (catalog.priceMax !== undefined)
    builder.numeric("price", "<=", catalog.priceMax);
  if (catalog.inStock) builder.facet("availableForSale", true);

  return builder;
}

/**
 * Algolia sorts by relevance; dedicated sort orders live in replica indexes.
 * By convention a sorted query targets `${baseIndex}_<sort>` (create these
 * replicas in the Algolia dashboard, ranked by the matching attribute). Returns
 * null for relevance/no sort, meaning "use the primary index".
 *
 * The adapter falls back to `algoliaSort` (in-memory, page-only) when a replica
 * is missing, so search keeps working before replicas are configured.
 */
export function replicaIndexFor(
  baseIndex: string,
  sort?: SortValue,
): string | null {
  switch (sort) {
    case "price-asc":
      return `${baseIndex}_price_asc`;
    case "price-desc":
      return `${baseIndex}_price_desc`;
    case "title":
      return `${baseIndex}_title_asc`;
    default:
      return null;
  }
}

/**
 * In-memory sort of the fetched page — the fallback when the sort replica
 * doesn't exist yet. Correct only within `limit`; prefer replicas (see
 * `replicaIndexFor`) for correct ordering across the full result set.
 */
export function algoliaSort(
  hits: ProductCard[],
  sort?: SortValue,
): ProductCard[] {
  const amount = (product: ProductCard) => Number(product.minPrice.amount);
  switch (sort) {
    case "price-asc":
      return [...hits].sort((a, b) => amount(a) - amount(b));
    case "price-desc":
      return [...hits].sort((a, b) => amount(b) - amount(a));
    case "title":
      return [...hits].sort((a, b) => a.title.localeCompare(b.title));
    default:
      return hits;
  }
}
