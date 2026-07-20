"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button, EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/app/[locale]/products/_components/product-card";
import { useWishlistProducts } from "@/hooks/use-wishlist-products";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "./use-wishlist";

/** Grid of saved products, resolved from localStorage handles per render. */
export function WishlistView() {
  const t = useTranslations("wishlist");
  const { handles } = useWishlist();
  const { products } = useWishlistProducts(handles);

  // Filtering by live handles makes removals instant while a refetch runs.
  const visible = products?.filter((p) => handles.includes(p.handle));

  if (handles.length === 0) {
    return (
      <EmptyState
        icon={<HeartIcon />}
        title={t("emptyTitle")}
        description={t("emptyHint")}
        action={
          <Button asChild>
            <Link href="/">{t("browseCta")}</Link>
          </Button>
        }
      />
    );
  }

  if (!visible) {
    return <ProductGridSkeleton count={4} />;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:grid-cols-4">
      {visible.map((product) => (
        <ProductCard key={product.id} product={product} variant="wishlist" />
      ))}
    </div>
  );
}
