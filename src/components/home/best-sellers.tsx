import { useTranslations } from "next-intl";
import { Container, SectionHeader } from "@/core/ui";
import { ProductCard } from "@/domains/product";
import type { ProductCard as ProductCardData } from "@/domains/product/types";

export function BestSellers({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("home");

  if (products.length === 0) return null;

  return (
    <Container className="pb-12">
      <SectionHeader
        title={t("bestSellers")}
        action={t("viewAll")}
        actionHref="/collections/all"
        className="mb-4"
      />
      <div className="grid grid-cols-2 gap-4 md:gap-[1.125rem] lg:grid-cols-4">
        {products.slice(0, 4).map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </Container>
  );
}
