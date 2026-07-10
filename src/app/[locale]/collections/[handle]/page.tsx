import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCollection } from "@/domains/collection";
import { ProductCard } from "@/domains/product";

type PageProps = {
  params: Promise<{ locale: string; handle: string }>;
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

export default async function CollectionPage({ params }: PageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const [collection, t] = await Promise.all([
    getCollection(handle, locale),
    getTranslations("collection"),
  ]);
  if (!collection) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <header className="mb-6">
        <h1 className="text-2xl font-bold">{collection.title}</h1>
        {collection.description && (
          <p className="mt-1 text-muted-foreground">
            {collection.description}
          </p>
        )}
        <p className="mt-1 text-sm text-muted-foreground">
          {t("productsCount", { count: collection.products.length })}
        </p>
      </header>

      {collection.products.length === 0 ? (
        <p className="text-muted-foreground">{t("empty")}</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {collection.products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
