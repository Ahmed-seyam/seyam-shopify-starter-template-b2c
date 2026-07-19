import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductGrid } from "@/components/catalog/product-grid";
import { Container, Heading, SearchInput } from "@/components/ui";
import { getSearchProvider } from "@/app/[locale]/search";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ q?: string }>;
};

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("search");
  return { title: t("title") };
}

export default async function SearchPage({ params, searchParams }: PageProps) {
  const [{ locale }, { q }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("search");

  const query = q?.trim() ?? "";
  const products = query
    ? await getSearchProvider().search(query, { locale })
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
        <ProductGrid products={products} />
      ) : (
        <p className="text-sm text-muted-foreground">{t("startTyping")}</p>
      )}
    </Container>
  );
}
