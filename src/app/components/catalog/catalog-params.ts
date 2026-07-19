/**
 * Shared catalog URL-state contract. Filters and sort live in search params
 * so listings stay linkable; both the collection page (server) and the
 * filter/sort controls (client) read through these helpers.
 */

export const SORT_VALUES = [
  "best-selling",
  "newest",
  "price-asc",
  "price-desc",
  "title",
] as const;

export type SortValue = (typeof SORT_VALUES)[number];

export type CatalogParams = {
  sort: SortValue;
  inStock: boolean;
  priceMin?: number;
  priceMax?: number;
};

export function parseCatalogParams(params: {
  sort?: string;
  available?: string;
  min?: string;
  max?: string;
}): CatalogParams {
  const sort = SORT_VALUES.includes(params.sort as SortValue)
    ? (params.sort as SortValue)
    : "best-selling";
  const num = (value?: string) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : undefined;
  };

  return {
    sort,
    inStock: params.available === "1",
    priceMin: num(params.min),
    priceMax: num(params.max),
  };
}

export function collectionSortArgs(sort: SortValue): {
  sortKey: "BEST_SELLING" | "CREATED" | "PRICE" | "TITLE";
  reverse: boolean;
} {
  switch (sort) {
    case "newest":
      return { sortKey: "CREATED", reverse: true };
    case "price-asc":
      return { sortKey: "PRICE", reverse: false };
    case "price-desc":
      return { sortKey: "PRICE", reverse: true };
    case "title":
      return { sortKey: "TITLE", reverse: false };
    default:
      return { sortKey: "BEST_SELLING", reverse: false };
  }
}

export type ShopifyProductFilter =
  | { available: boolean }
  | { price: { min?: number; max?: number } };

export function collectionFilters(params: CatalogParams): ShopifyProductFilter[] {
  const filters: ShopifyProductFilter[] = [];
  if (params.inStock) filters.push({ available: true });
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    filters.push({
      price: { min: params.priceMin, max: params.priceMax },
    });
  }
  return filters;
}
