"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useEffect, useState } from "react";
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
import { FilterSidebar } from "@/components/catalog/filter-panel";
// Deep import — the products barrel re-exports server-only queries.
import { ProductCard as ProductCardView } from "@/app/[locale]/products/_components/product-card";
import {
  SearchPageShell,
  SearchResultsLayout,
} from "../../_components/search-page-shell";
import { FacetPanel } from "./facet-panel";
import { MobileFacets } from "./mobile-facets";
import type { Hit } from "instantsearch.js";
import type { ProductCard } from "@/types/product";
import { SEARCH_INDEX } from "../facets";
import { searchRouting } from "../routing";
import { proxySearchClient } from "../search-client";
import { insightsClient, rememberQueryId, track } from "@/plugins/client/tracking";

/**
 * Algolia search page: InstantSearch state management + our kit UI. The
 * FacetPanel is generated from the `searchFacets` config object; URL state
 * mapping lives in ../routing.ts and the page layout in the shared
 * SearchPageShell, both keeping this mode in lockstep with the Shopify one.
 */

function SearchBox() {
  const t = useTranslations("search");
  const { query, refine } = useSearchBox();
  const [value, setValue] = useState(query);

  return (
    <form
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

  // Debounced Search event for GTM/CleverTap (Insights gets its own events
  // via the middleware) — fires once the user pauses typing.
  useEffect(() => {
    if (!query) return;
    const timer = setTimeout(() => track.search(query, nbHits), 1500);
    return () => clearTimeout(timer);
  }, [query, nbHits]);

  return (
    <Heading level={2}>
      {query
        ? `${t("resultsCount", { count: nbHits })} — ${t("resultsFor", { query })}`
        : t("title")}
    </Heading>
  );
}

function Hits() {
  const { items, sendEvent } = useHits<ProductCard>();

  // Standard grid, with a capture wrapper per hit so Algolia Insights
  // receives click events (with queryID) for relevance tuning. The runtime
  // objects are Algolia Hits (ProductCard + __queryID); ProductGrid types its
  // items as ProductCard, so we recover the Hit shape inside renderItem.
  return (
    <ProductGrid
      products={items}
      renderItem={(product) => {
        const hit = product as Hit<ProductCard>;
        return (
          <div
            onClickCapture={() => {
              sendEvent("click", hit, "Product Clicked");
              // Persist the queryID so a later add-to-cart (PDP, quick-add)
              // can send a search-attributed conversion.
              rememberQueryId(hit.handle, hit.__queryID);
            }}
          >
            <ProductCardView product={hit} />
          </div>
        );
      }}
    />
  );
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
  return (
    <InstantSearch
      searchClient={proxySearchClient}
      indexName={SEARCH_INDEX}
      routing={searchRouting}
      insights={{ insightsClient }}
      future={{ preserveSharedStateOnUnmount: true }}
    >
      <SearchPageShell searchBox={<SearchBox />}>
        <SearchResultsLayout
          sidebar={
            <FilterSidebar>
              <FacetPanel />
            </FilterSidebar>
          }
          toolbar={
            <>
              <Stats />
              <MobileFacets />
            </>
          }
          chips={<RefinementChips />}
          pagination={<Pager />}
        >
          <Hits />
        </SearchResultsLayout>
      </SearchPageShell>
    </InstantSearch>
  );
}
