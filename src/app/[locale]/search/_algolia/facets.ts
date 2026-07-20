/**
 * Facet configuration — the single object that drives the search filter UI.
 * Each entry declares an indexed attribute and how to render/refine it; the
 * FilterPanel maps `type` to a control (list → checkbox list with counts,
 * boolean → single toggle, range → min/max inputs) and InstantSearch routing
 * syncs the state into URL params.
 *
 * Add a filter = add a line here (and list the attribute in the Algolia
 * index's attributesForFaceting). Records are indexed by @/plugins/server/algolia/indexing.ts with
 * the Product card shape, so vendor/tags/availableForSale/price all exist.
 */

export type FacetConfig = {
  attribute: string;
  /** Key under the `catalog.filters` messages namespace. */
  labelKey: string;
  type: "list" | "boolean" | "range";
  limit?: number;
  showMore?: boolean;
  showMoreLimit?: number;
};

export const SEARCH_INDEX = "products";

export const searchFacets: FacetConfig[] = [
  {
    attribute: "vendor",
    labelKey: "vendor",
    type: "list",
    limit: 5,
    showMore: true,
    showMoreLimit: 20,
  },
  {
    attribute: "tags",
    labelKey: "tags",
    type: "list",
    limit: 8,
    showMore: true,
    showMoreLimit: 30,
  },
  {
    attribute: "availableForSale",
    labelKey: "inStockOnly",
    type: "boolean",
  },
  {
    attribute: "price",
    labelKey: "price",
    type: "range",
  },
];
