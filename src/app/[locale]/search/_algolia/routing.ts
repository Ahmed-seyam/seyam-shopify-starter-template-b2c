import { history } from "instantsearch.js/es/lib/routers";
import type { UiState } from "instantsearch.js";
import { SEARCH_INDEX, searchFacets } from "./facets";

/**
 * InstantSearch <-> URL mapping. State is synced to the same URL params the
 * rest of the site uses (q, available, min/max via price, plus one param per
 * list facet), so Algolia and Shopify search modes share bookmarkable URLs.
 */
export const searchRouting = {
  router: history<Record<string, unknown>>({ cleanUrlOnDispose: false }),
  stateMapping: {
    stateToRoute(uiState: UiState) {
      const state = uiState[SEARCH_INDEX] ?? {};
      const route: Record<string, unknown> = {
        q: state.query,
        page: state.page,
        available: state.toggle?.availableForSale ? "1" : undefined,
        price: state.range?.price,
      };
      for (const facet of searchFacets) {
        if (facet.type === "list")
          route[facet.attribute] =
            state.refinementList?.[facet.attribute]?.join(",");
      }
      return route;
    },
    routeToState(route: Record<string, unknown>) {
      const refinementList: Record<string, string[]> = {};
      for (const facet of searchFacets) {
        const value = route[facet.attribute];
        if (facet.type === "list" && typeof value === "string" && value)
          refinementList[facet.attribute] = value.split(",");
      }
      return {
        [SEARCH_INDEX]: {
          query: typeof route.q === "string" ? route.q : "",
          page: Number(route.page) || undefined,
          ...(Object.keys(refinementList).length > 0 ? { refinementList } : {}),
          ...(route.available === "1"
            ? { toggle: { availableForSale: true } }
            : {}),
          ...(typeof route.price === "string" && route.price
            ? { range: { price: route.price } }
            : {}),
        },
      };
    },
  },
};
