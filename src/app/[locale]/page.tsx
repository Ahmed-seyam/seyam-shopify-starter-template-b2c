import { setRequestLocale } from "next-intl/server";
import { BestSellers } from "@/components/home/best-sellers";
import { CategoryGrid } from "@/components/home/category-grid";
import { Hero } from "@/components/home/hero";
import { Newsletter } from "@/components/home/newsletter";
import { Testimonials } from "@/components/home/testimonials";
import { ValueProps } from "@/components/home/value-props";
import { getCollections } from "@/app/[locale]/collections";
import { getProducts } from "@/app/[locale]/products";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [products, collections] = await Promise.all([
    getProducts(locale, { first: 4, sortKey: "BEST_SELLING" }),
    getCollections(locale, { first: 6 }),
  ]);

  return (
    <>
      <Hero variant="split" />
      <ValueProps />
      <CategoryGrid collections={collections} />
      <BestSellers products={products} />
      <Testimonials />
      <Newsletter />
    </>
  );
}
