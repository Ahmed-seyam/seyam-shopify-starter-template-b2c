import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ProductCard } from "@/domains/product";
import { getSearchProvider } from "@/domains/search";

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
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">
        {query ? t("resultsFor", { query }) : t("title")}
      </h1>

      {query && products.length === 0 ? (
        <p className="text-muted-foreground">{t("noResults", { query })}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
