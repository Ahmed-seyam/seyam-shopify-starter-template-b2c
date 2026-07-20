"use client";

import { HeartIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import { Button, EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/app/[locale]/products/_components/product-card";
import type { ProductCard as ProductCardType } from "@/types/product";
import { Link } from "@/i18n/navigation";
// Server Actions are imported from their 'use server' file directly, never via
// the domain barrel.
import { getWishlistProducts } from "../_actions/get-wishlist-products";
import { useWishlist } from "./use-wishlist";

/** Grid of saved products, resolved from localStorage handles per render. */
export function WishlistView() {
  const t = useTranslations("wishlist");
  const locale = useLocale();
  const { handles } = useWishlist();
  const [products, setProducts] = useState<ProductCardType[] | null>(null);

  const key = handles.join(",");
  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    getWishlistProducts(key.split(","), locale).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [key, locale]);

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
