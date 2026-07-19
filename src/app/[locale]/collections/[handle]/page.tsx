import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ActiveFilterChips } from "@/components/catalog/active-filter-chips";
import {
  collectionFilters,
  collectionSortArgs,
  parseCatalogParams,
} from "@/components/catalog/catalog-params";
import { FilterPanel, MobileFilters } from "@/components/catalog/filter-panel";
import { ProductGrid } from "@/components/catalog/product-grid";
import { SortSelect } from "@/components/catalog/sort-select";
import { Breadcrumbs, Container, Heading, Text } from "@/core/ui";
import { getCollection } from "@/domains/collection";

type PageProps = {
  params: Promise<{ locale: string; handle: string }>;
  searchParams: Promise<{
    sort?: string;
    available?: string;
    min?: string;
    max?: string;
  }>;
};

export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const collection = await getCollection(handle, locale);
  if (!collection) return {};

  return {
    title: collection.seo.title ?? collection.title,
    description: collection.seo.description ?? collection.description,
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: PageProps) {
  const [{ locale, handle }, rawParams] = await Promise.all([
    params,
    searchParams,
  ]);
  setRequestLocale(locale);

  const catalogParams = parseCatalogParams(rawParams);
  const { sortKey, reverse } = collectionSortArgs(catalogParams.sort);
  const filters = collectionFilters(catalogParams);

  const [collection, t, tLayout] = await Promise.all([
    getCollection(handle, locale, {
      sortKey,
      reverse,
      filters: filters.length > 0 ? filters : undefined,
    }),
    getTranslations("collection"),
    getTranslations("layout"),
  ]);
  if (!collection) notFound();

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: tLayout("home"), href: "/" },
          { label: collection.title },
        ]}
        className="mb-5"
      />

      <header className="mb-7 max-w-2xl">
        <Heading level={1} className="text-3xl md:text-4xl">
          {collection.title}
        </Heading>
        {collection.description && (
          <Text variant="muted" className="mt-2">
            {collection.description}
          </Text>
        )}
      </header>

      <div className="flex items-start gap-10">
        <FilterPanel params={catalogParams} />

        <div className="flex min-w-0 flex-1 flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <MobileFilters params={catalogParams} />
              <p className="text-sm text-muted-foreground">
                {t("productsCount", { count: collection.products.length })}
              </p>
            </div>
            <SortSelect value={catalogParams.sort} />
          </div>

          <ActiveFilterChips params={catalogParams} />

          <ProductGrid products={collection.products} />
        </div>
      </div>
    </Container>
  );
}
