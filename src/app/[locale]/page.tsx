import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCollections } from "@/domains/collection";
import { getProducts, ProductCard } from "@/domains/product";
import { Link } from "@/i18n/navigation";
import { Badge } from "@/core/ui/badge";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("home");

  const [products, collections] = await Promise.all([
    getProducts(locale, { first: 8, sortKey: "BEST_SELLING" }),
    getCollections(locale, { first: 8 }),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {collections.length > 0 && (
        <section className="mb-10">
          <h2 className="mb-4 text-xl font-semibold">
            {t("browseCollections")}
          </h2>
          <div className="flex flex-wrap gap-2">
            {collections.map((collection) => (
              <Link
                key={collection.handle}
                href={`/collections/${collection.handle}`}
              >
                <Badge variant="outline" className="px-3 py-1 text-sm">
                  {collection.title}
                </Badge>
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h1 className="mb-6 text-2xl font-bold">{t("featuredTitle")}</h1>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </section>
    </div>
  );
}
