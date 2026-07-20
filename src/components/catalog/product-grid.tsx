import { Fragment, type ReactNode } from "react";
import { SearchXIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, EmptyState } from "@/components/ui";
// Deep import keeps the server-only parts of the products barrel out of the
// client bundle — this grid is rendered from both server and client trees.
import { ProductCard } from "@/app/[locale]/products/_components/product-card";
import type { ProductCard as ProductCardData } from "@/types/product";
import { Link } from "@/i18n/navigation";

export function ProductGrid({
  products,
  renderItem,
}: {
  products: ProductCardData[];
  /** Override the default card, e.g. to wrap it with analytics handlers. */
  renderItem?: (product: ProductCardData) => ReactNode;
}) {
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
        <Fragment key={product.id}>
          {renderItem ? renderItem(product) : <ProductCard product={product} />}
        </Fragment>
      ))}
    </div>
  );
}
