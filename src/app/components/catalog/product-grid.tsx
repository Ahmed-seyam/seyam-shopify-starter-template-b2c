import { SearchXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@/app/core/ui";
import { ProductCard } from "@/app/[locale]/products";
import type { ProductCard as ProductCardData } from "@/app/[locale]/products/types";
import { Link } from "@/i18n/navigation";

export function ProductGrid({ products }: { products: ProductCardData[] }) {
  const t = useTranslations("catalog");

  if (products.length === 0) {
    return (
      <EmptyState
        icon={<SearchXIcon />}
        title={t("emptyTitle")}
        description={t("emptyBody")}
        action={
          <Button asChild variant="secondary">
            <Link href="/">{t("backHome")}</Link>
          </Button>
        }
        className="flex-1"
      />
    );
  }

  return (
    <div className="grid flex-1 grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 md:gap-x-[1.125rem]">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
