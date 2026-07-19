"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { history } from "instantsearch.js/es/lib/routers";
import type { UiState } from "instantsearch.js";
import {
  InstantSearch,
  useClearRefinements,
  useCurrentRefinements,
  useHits,
  usePagination,
  useSearchBox,
  useStats,
} from "react-instantsearch";
import { Badge, Heading, SearchInput } from "@/components/ui";
import { ProductGrid } from "@/components/catalog/product-grid";
import { FacetPanel } from "./facet-panel";
import { MobileFacets } from "./mobile-facets";
import type { ProductCard } from "@/app/[locale]/products/_types";
import { SEARCH_INDEX, searchFacets } from "./facets";
import { proxySearchClient } from "./search-client";

/**
 * Algolia search page: InstantSearch state management + our kit UI. The
 * FilterPanel is generated from the `searchFacets` config object; state is
 * synced to the same URL params the rest of the site uses (q, available,
 * min/max via price, plus one param per list facet).
 */

const routing = {
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

function SearchBox() {
  const t = useTranslations("search");
  const { query, refine } = useSearchBox();
  const [value, setValue] = useState(query);

  return (
    <form
      className="mx-auto mb-8 w-full max-w-xl"
      onSubmit={(event) => {
        event.preventDefault();
        refine(value);
      }}
    >
      <SearchInput
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          refine(event.target.value);
        }}
        placeholder={t("placeholder")}
        aria-label={t("title")}
        className="h-12"
      />
    </form>
  );
}

function RefinementChips() {
  const t = useTranslations("catalog.filters");
  const { items } = useCurrentRefinements();
  const { canRefine: canClear, refine: clearAll } = useClearRefinements();

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {items.flatMap((item) =>
        item.refinements.map((refinement) => (
          <Badge
            key={`${item.attribute}:${refinement.label}`}
            variant="outline"
            className="gap-1 pe-1"
          >
            {refinement.label}
            <button
              type="button"
              aria-label={`${t("clearAll")}: ${refinement.label}`}
              onClick={() => item.refine(refinement)}
              className="cursor-pointer rounded-full p-0.5 hover:bg-muted"
            >
              <XIcon className="size-3" />
            </button>
          </Badge>
        )),
      )}
      {canClear && (
        <button
          type="button"
          onClick={clearAll}
          className="cursor-pointer text-xs font-medium text-primary hover:underline"
        >
          {t("clearAll")}
        </button>
      )}
    </div>
  );
}

function Stats() {
  const t = useTranslations("search");
  const { nbHits, query } = useStats();

  return (
    <Heading level={2}>
      {query
        ? `${t("resultsCount", { count: nbHits })} — ${t("resultsFor", { query })}`
        : t("title")}
    </Heading>
  );
}

function Hits() {
  const { items } = useHits<ProductCard & Record<string, unknown>>();
  return <ProductGrid products={items} />;
}

function Pager() {
  const { pages, currentRefinement, nbPages, isFirstPage, isLastPage, refine } =
    usePagination({ padding: 2 });

  if (nbPages <= 1) return null;

  const itemClass =
    "inline-flex size-10 cursor-pointer items-center justify-center rounded-md border text-sm font-medium transition-colors";

  return (
    <nav aria-label="Pagination" className="flex items-center justify-center gap-2">
      <button
        type="button"
        disabled={isFirstPage}
        onClick={() => refine(currentRefinement - 1)}
        className={`${itemClass} border-border text-foreground hover:bg-muted/60 disabled:cursor-default disabled:text-muted-foreground/40 disabled:hover:bg-transparent`}
      >
        ‹
      </button>
      {pages.map((page) => (
        <button
          key={page}
          type="button"
          aria-current={page === currentRefinement ? "page" : undefined}
          onClick={() => refine(page)}
          className={`${itemClass} ${
            page === currentRefinement
              ? "border-foreground bg-foreground text-background"
              : "border-border text-foreground hover:bg-muted/60"
          }`}
        >
          {page + 1}
        </button>
      ))}
      <button
        type="button"
        disabled={isLastPage}
        onClick={() => refine(currentRefinement + 1)}
        className={`${itemClass} border-border text-foreground hover:bg-muted/60 disabled:cursor-default disabled:text-muted-foreground/40 disabled:hover:bg-transparent`}
      >
        ›
      </button>
    </nav>
  );
}

export function AlgoliaInstantSearch() {
  const t = useTranslations("catalog.filters");

  return (
    <InstantSearch
      searchClient={proxySearchClient}
      indexName={SEARCH_INDEX}
      routing={routing}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <SearchBox />

      <div className="flex items-start gap-10">
        <aside className="hidden w-60 shrink-0 lg:block">
          <p className="mb-5 font-serif text-lg font-medium text-foreground">
            {t("title")}
          </p>
          <FacetPanel />
        </aside>

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Stats />
            <MobileFacets />
          </div>

          <RefinementChips />
          <Hits />
          <Pager />
        </div>
      </div>
    </InstantSearch>
  );
}
