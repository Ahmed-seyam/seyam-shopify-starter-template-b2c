import { getTranslations } from "next-intl/server";
import { SectionHeader } from "@/app/core/ui";
import { getProducts } from "../_actions/get-products";
import { ProductCard } from "./product-card";

/** "You may also like" — best sellers minus the current product. */
export async function RelatedProducts({
  currentHandle,
  locale,
}: {
  currentHandle: string;
  locale: string;
}) {
  const t = await getTranslations("product");
  const products = (
    await getProducts(locale, { first: 5, sortKey: "BEST_SELLING" })
  )
    .filter((product) => product.handle !== currentHandle)
    .slice(0, 4);

  if (products.length === 0) return null;

  return (
    <section className="border-t border-border pt-10">
      <SectionHeader title={t("related")} className="mb-4" />
      <div className="grid grid-cols-2 gap-4 md:gap-[1.125rem] lg:grid-cols-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
