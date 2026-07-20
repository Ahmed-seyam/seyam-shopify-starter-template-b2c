import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { parseCatalogParams } from "@/lib/client/catalog/params";
import { FilterPanel, MobileFilters } from "@/components/catalog/filter-panel";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { Heading, SearchInput } from "@/components/ui";
import { env } from "@/config/env";
import { searchProducts } from "./_actions/search-products";
import {
  SearchPageShell,
  SearchResultsLayout,
} from "./_components/search-page-shell";
import { AlgoliaInstantSearch } from "./_algolia/components/instant-search";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{
    q?: string;
    sort?: string;
    available?: string;
    min?: string;
    max?: string;
  }>;
};

// Search reads `q`/filters from searchParams and fetches results through the
// internal /api layer — always rendered on demand.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("search");

  // Algolia mode: fully client-driven InstantSearch page (facet counts,
  // instant refinements) proxied through /api/search/query. Note this page
  // deliberately bypasses the SearchProvider port — the port still serves
  // the /api/search typeahead via the Algolia adapter.
  if (env().SEARCH_PROVIDER === "algolia") {
    return <AlgoliaInstantSearch />;
  }

  const query = rawParams.q?.trim() ?? "";
  const catalogParams = parseCatalogParams(rawParams);
  const products = query
    ? await searchProducts(query, locale, catalogParams)
    : [];

  return (
    <SearchPageShell
      searchBox={
        <form action="">
          <SearchInput
            name="q"
            defaultValue={query}
            placeholder={t("placeholder")}
            aria-label={t("title")}
            className="h-12"
          />
        </form>
      }
    >
      <Heading level={2} className="mb-6">
        {query ? t("resultsFor", { query }) : t("title")}
      </Heading>

      {query ? (
        <SearchResultsLayout
          sidebar={<FilterPanel params={catalogParams} />}
          toolbar={
            <>
              <MobileFilters params={catalogParams} />
              <SortSelect value={catalogParams.sort} />
            </>
          }
          chips={<ActiveFilterChips params={catalogParams} />}
        >
          <ProductGrid products={products} />
        </SearchResultsLayout>
      ) : (
        <p className="text-sm text-muted-foreground">{t("startTyping")}</p>
      )}
    </SearchPageShell>
  );
}
