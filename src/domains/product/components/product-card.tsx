"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { Badge, Button, IconButton, ImageFrame, Price } from "@/core/ui";
import { WishlistButton, useWishlist } from "@/domains/wishlist";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { ProductCard as ProductCardType } from "../types";
import { QuickAddDialog } from "./quick-add-dialog";

type ProductCardProps = {
  product: ProductCardType;
  /**
   * `default` — grid card with heart + Quick Add;
   * `compact` — small horizontal row (suggestions, popups);
   * `wishlist` — grid card with remove ✕ instead of the heart.
   */
  variant?: "default" | "compact" | "wishlist";
  /** Optional label rendered as the dark badge (e.g. "Best Seller"). */
  badge?: string;
  className?: string;
};

export function ProductCard({
  product,
  variant = "default",
  badge,
  className,
}: ProductCardProps) {
  const t = useTranslations("product");
  const { remove } = useWishlist();
  const [quickAddOpen, setQuickAddOpen] = useState(false);

  const onSale =
    product.compareAtPrice &&
    Number(product.compareAtPrice.amount) > Number(product.minPrice.amount);

  if (variant === "compact") {
    return (
      <Link
        href={`/products/${product.handle}`}
        className={cn(
          "flex items-center gap-3 rounded-md p-2 transition-colors hover:bg-muted/60",
          className
        )}
      >
        <ImageFrame
          src={product.featuredImage?.url}
          alt={product.featuredImage?.altText ?? product.title}
          ratio="square"
          radius="md"
          sizes="48px"
          className="w-12 shrink-0"
        />
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
          {product.title}
        </span>
        <Price
          money={product.minPrice}
          compareAt={product.compareAtPrice}
          className="shrink-0 text-sm"
        />
      </Link>
    );
  }

  return (
    <div className={cn("group flex flex-col gap-2.5", className)}>
      <div className="relative">
        <Link
          href={`/products/${product.handle}`}
          aria-label={product.title}
          className="block"
        >
          <ImageFrame
            src={product.featuredImage?.url}
            alt={product.featuredImage?.altText ?? product.title}
            ratio="portrait"
            radius="lg"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 320px"
            imgClassName="transition-transform duration-300 group-hover:scale-[1.03]"
          />
        </Link>

        <div className="absolute top-2.5 start-2.5 flex flex-col gap-1.5">
          {badge && <Badge variant="dark">{badge}</Badge>}
          {onSale && <Badge variant="sale">{t("sale")}</Badge>}
          {!product.availableForSale && (
            <Badge variant="outline">{t("outOfStock")}</Badge>
          )}
        </div>

        {variant === "wishlist" ? (
          <IconButton
            variant="surface"
            size="sm"
            aria-label={t("removeFromWishlist")}
            className="absolute top-2.5 end-2.5"
            onClick={() => remove(product.handle)}
          >
            <XIcon />
          </IconButton>
        ) : (
          <WishlistButton
            handle={product.handle}
            title={product.title}
            className="absolute top-2.5 end-2.5"
          />
        )}
      </div>

      <Link
        href={`/products/${product.handle}`}
        className="text-[0.90625rem] font-semibold text-foreground hover:underline"
      >
        {product.title}
      </Link>
      <Price
        money={product.minPrice}
        compareAt={product.compareAtPrice}
        className="text-sm text-muted-foreground"
      />

      {product.availableForSale ? (
        <Button
          variant="secondary"
          size="sm"
          className="w-full border-foreground"
          onClick={() => setQuickAddOpen(true)}
        >
          {variant === "wishlist" ? t("addToCart") : t("quickAdd")}
        </Button>
      ) : (
        <Button variant="secondary" size="sm" className="w-full" disabled>
          {t("outOfStock")}
        </Button>
      )}

      <QuickAddDialog
        handle={product.handle}
        open={quickAddOpen}
        onOpenChange={setQuickAddOpen}
      />
    </div>
  );
}
