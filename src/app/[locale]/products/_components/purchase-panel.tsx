"use client";

import { HeartIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import { Button, QuantityStepper, toast } from "@/app/core/ui";
// Server Actions must be imported from the 'use server' file directly —
// the domain barrel also re-exports server-only queries.
import { addToCart } from "@/app/[locale]/cart/_actions/add-to-cart";
import { useWishlist } from "@/app/[locale]/account/wishlist";
import { cn } from "@/lib/utils";
import type { ProductVariant } from "../_types";

/**
 * PDP purchase block: quantity stepper + add-to-cart + wishlist secondary.
 * Variant resolution mirrors the URL-driven VariantSelector.
 */
export function PurchasePanel({
  handle,
  title,
  variants,
}: {
  handle: string;
  title: string;
  variants: ProductVariant[];
}) {
  const t = useTranslations("product");
  const tWishlist = useTranslations("wishlist");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const [pending, startTransition] = useTransition();
  const { has, toggle } = useWishlist();

  const selectedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0];
    return variants.find((variant) =>
      variant.selectedOptions.every(
        (option) => searchParams.get(option.name) === option.value
      )
    );
  }, [variants, searchParams]);

  const inWishlist = has(handle);
  const disabled = !selectedVariant?.availableForSale || pending;

  return (
    <div className="flex flex-col gap-3">
      <div className="flex gap-3">
        <QuantityStepper value={quantity} onChange={setQuantity} />
        <Button
          size="lg"
          className="h-11 flex-1"
          disabled={disabled}
          onClick={() => {
            if (!selectedVariant) return;
            startTransition(async () => {
              await addToCart(selectedVariant.id, quantity, locale);
              // Header cart badge (client-fetched to keep pages static) re-fetches on this.
              window.dispatchEvent(new Event("cart:updated"));
              toast.success(t("addedToCart", { title }));
            });
          }}
        >
          {pending
            ? t("adding")
            : selectedVariant && !selectedVariant.availableForSale
              ? t("outOfStock")
              : !selectedVariant
                ? t("selectOptions")
                : t("addToCart")}
        </Button>
      </div>
      <Button
        variant="secondary"
        onClick={() => {
          const added = toggle(handle);
          toast(
            added
              ? tWishlist("addedToast", { title })
              : tWishlist("removedToast", { title })
          );
        }}
      >
        <HeartIcon className={cn(inWishlist && "fill-sale text-sale")} />
        {inWishlist ? tWishlist("remove") : tWishlist("add")}
      </Button>
    </div>
  );
}
