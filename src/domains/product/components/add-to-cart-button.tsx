"use client";

import { useMemo, useTransition } from "react";
import { useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Button } from "@/core/ui/button";
// Server Actions must be imported from the 'use server' file directly —
// the domain barrel also re-exports server-only queries.
import { addToCart } from "@/domains/cart/actions/add-to-cart";
import type { ProductVariant } from "../types";

export function AddToCartButton({ variants }: { variants: ProductVariant[] }) {
  const t = useTranslations("product");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const selectedVariant = useMemo(() => {
    if (variants.length === 1) return variants[0];
    return variants.find((variant) =>
      variant.selectedOptions.every(
        (option) => searchParams.get(option.name) === option.value,
      ),
    );
  }, [variants, searchParams]);

  const disabled = !selectedVariant?.availableForSale || pending;

  return (
    <Button
      size="lg"
      className="w-full"
      disabled={disabled}
      onClick={() => {
        if (!selectedVariant) return;
        startTransition(async () => {
          await addToCart(selectedVariant.id, 1, locale);
          // Header cart badge (client-fetched to keep pages static) re-fetches on this.
          window.dispatchEvent(new Event("cart:updated"));
        });
      }}
    >
      {pending
        ? t("adding")
        : selectedVariant && !selectedVariant.availableForSale
          ? t("outOfStock")
          : t("addToCart")}
    </Button>
  );
}
