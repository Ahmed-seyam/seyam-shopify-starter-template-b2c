"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Badge,
  Button,
  IconButton,
  Popover,
  PopoverContent,
  PopoverTrigger,
  Spinner,
  Text,
} from "@/components/ui";
import { ProductCard } from "@/app/[locale]/products/_components/product-card";
import { useWishlistProducts } from "@/hooks/use-wishlist-products";
import { Link } from "@/i18n/navigation";
import { useWishlist } from "./use-wishlist";

const PREVIEW_COUNT = 3;

/** Header heart: count badge + popover preview of the latest saved items. */
export function WishlistPopup() {
  const t = useTranslations("wishlist");
  const { handles, count } = useWishlist();
  const [open, setOpen] = useState(false);

  // Latest saves first; refetched while open so removals reflect immediately.
  const previewHandles = open ? handles.slice(-PREVIEW_COUNT).reverse() : [];
  const { products } = useWishlistProducts(previewHandles);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <IconButton aria-label={t("title")} className="relative">
          <HeartIcon />
          {count > 0 && (
            <Badge
              variant="count"
              aria-hidden
              className="absolute -top-0.5 -end-0.5"
            >
              {count}
            </Badge>
          )}
        </IconButton>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-3">
        {count === 0 ? (
          <Text variant="muted" className="px-2 py-6 text-center text-sm">
            {t("emptyTitle")}
          </Text>
        ) : products === undefined ? (
          <div className="flex justify-center py-6">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-col gap-1">
            {products
              .filter((product) => handles.includes(product.handle))
              .map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  variant="compact"
                />
              ))}
          </div>
        )}
        <Button
          asChild
          variant="outline"
          size="sm"
          className="mt-3 w-full"
          onClick={() => setOpen(false)}
        >
          <Link href="/account/wishlist">{t("viewAll")}</Link>
        </Button>
      </PopoverContent>
    </Popover>
  );
}
