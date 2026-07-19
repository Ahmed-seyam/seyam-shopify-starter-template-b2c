import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import { parseCatalogParams } from "@/components/catalog/catalog-params";
import { FilterPanel, MobileFilters } from "@/components/catalog/filter-panel";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { Container, Heading, SearchInput } from "@/components/ui";
import { env } from "@/lib/config/env";
import { getSearchProvider } from "@/app/[locale]/search";
import { AlgoliaInstantSearch } from "./_algolia/instant-search";

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

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ locale }, rawParams] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("search");

  // Algolia mode: fully client-driven InstantSearch page (facet counts,
  // instant refinements) proxied through /api/search/query.
  if (env().SEARCH_PROVIDER === "algolia") {
    return (
      <Container className="py-8">
        <AlgoliaInstantSearch />
      </Container>
    );
  }

  const query = rawParams.q?.trim() ?? "";
  const catalogParams = parseCatalogParams(rawParams);
  const products = query
    ? await getSearchProvider().search(query, { locale, catalog: catalogParams })
    : [];

  return (
    <Container className="py-8">
      <form action="" className="mx-auto mb-8 w-full max-w-xl">
        <SearchInput
          name="q"
          defaultValue={query}
          placeholder={t("placeholder")}
          aria-label={t("title")}
          className="h-12"
        />
      </form>

      <Heading level={2} className="mb-6">
        {query ? t("resultsFor", { query }) : t("title")}
      </Heading>

      {query ? (
        <div className="flex items-start gap-10">
          <FilterPanel params={catalogParams} />

          <div className="flex min-w-0 flex-1 flex-col gap-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <MobileFilters params={catalogParams} />
              <SortSelect value={catalogParams.sort} />
            </div>

            <ActiveFilterChips params={catalogParams} />

            <ProductGrid products={products} />
          </div>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{t("startTyping")}</p>
      )}
    </Container>
  );
}
