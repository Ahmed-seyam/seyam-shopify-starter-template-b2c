"use client";

import { HeartIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { Button, QuantityStepper, toast } from "@/components/ui";
import { useCart } from "@/hooks/use-cart";
import { track } from "@/plugins/client/tracking";
import { useWishlist } from "@/app/[locale]/account/wishlist";
import { cn } from "@/utils";
import type { ProductVariant } from "@/types/product";

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
  const searchParams = useSearchParams();
  const [quantity, setQuantity] = useState(1);
  const { addItem, isMutating } = useCart();
  const { has, toggle } = useWishlist();
  const pending = isMutating;

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
          onClick={async () => {
            if (!selectedVariant) return;
            await addItem(selectedVariant.id, quantity);
            track.addToCart({
              id: selectedVariant.id,
              handle,
              name: title,
              price: Number(selectedVariant.price.amount),
              currency: selectedVariant.price.currencyCode,
              quantity,
            });
            toast.success(t("addedToCart", { title }));
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
