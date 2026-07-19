"use client";

import { CheckCircle2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useMemo, useState, useTransition } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogTitle,
  ImageFrame,
  Price,
  QuantityStepper,
  Spinner,
  toast,
} from "@/app/core/ui";
// Server Actions must be imported from the 'use server' file directly —
// the domain barrel also re-exports server-only queries.
import { addToCart } from "@/app/[locale]/cart/_actions/add-to-cart";
import { quickViewProduct } from "../_actions/quick-view";
import type { Product, ProductVariant } from "../_types";
import { OptionPill } from "./option-pill";

/**
 * Quick-add modal opened from product cards. Fetches the full product on
 * open; shares the option-pill primitives with the PDP variant selector.
 */
export function QuickAddDialog({
  handle,
  open,
  onOpenChange,
}: {
  handle: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const t = useTranslations("product");
  const locale = useLocale();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [pending, startTransition] = useTransition();

  const selectedVariant: ProductVariant | undefined = useMemo(() => {
    if (!product) return undefined;
    if (product.variants.length === 1) return product.variants[0];
    return product.variants.find((variant) =>
      variant.selectedOptions.every(
        (option) => selected[option.name] === option.value
      )
    );
  }, [product, selected]);

  const handleOpenChange = (next: boolean) => {
    onOpenChange(next);
    if (next && !product && !loading) {
      setLoading(true);
      quickViewProduct(handle, locale).then((data) => {
        setProduct(data);
        setLoading(false);
        if (data) {
          // Preselect the first available variant so one-option products
          // are addable immediately.
          const first =
            data.variants.find((variant) => variant.availableForSale) ??
            data.variants[0];
          if (first) {
            setSelected(
              Object.fromEntries(
                first.selectedOptions.map((option) => [
                  option.name,
                  option.value,
                ])
              )
            );
          }
        }
      });
    }
    if (!next) setAdded(false);
  };

  const variantAvailable = (name: string, value: string) =>
    product?.variants.some(
      (variant) =>
        variant.availableForSale &&
        variant.selectedOptions.every((option) =>
          option.name === name
            ? option.value === value
            : selected[option.name] === option.value
        )
    ) ?? false;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-xl">
        {loading && (
          <div className="flex items-center justify-center py-16">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        )}

        {!loading && product && (
          <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
            <ImageFrame
              src={product.featuredImage?.url}
              alt={product.featuredImage?.altText ?? product.title}
              ratio="portrait"
              radius="lg"
              sizes="200px"
              className="hidden sm:block"
            />
            <div className="flex flex-col gap-4">
              <div className="grid gap-1 pe-8">
                <DialogTitle>{product.title}</DialogTitle>
                <Price
                  money={selectedVariant?.price ?? product.minPrice}
                  compareAt={
                    selectedVariant?.compareAtPrice ?? product.compareAtPrice
                  }
                  className="text-base"
                />
              </div>

              {product.options
                .filter((option) => option.values.length > 1)
                .map((option) => (
                  <div key={option.name} className="grid gap-2">
                    <p className="text-sm font-medium text-foreground">
                      {option.name}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {option.values.map((value) => (
                        <OptionPill
                          key={value}
                          selected={selected[option.name] === value}
                          unavailable={!variantAvailable(option.name, value)}
                          onClick={() =>
                            setSelected((previous) => ({
                              ...previous,
                              [option.name]: value,
                            }))
                          }
                        >
                          {value}
                        </OptionPill>
                      ))}
                    </div>
                  </div>
                ))}

              <div className="mt-auto flex items-center gap-3">
                <QuantityStepper value={quantity} onChange={setQuantity} />
                <Button
                  className="flex-1"
                  disabled={!selectedVariant?.availableForSale || pending}
                  onClick={() => {
                    if (!selectedVariant) return;
                    startTransition(async () => {
                      await addToCart(selectedVariant.id, quantity, locale);
                      window.dispatchEvent(new Event("cart:updated"));
                      setAdded(true);
                      toast.success(t("addedToCart", { title: product.title }));
                    });
                  }}
                >
                  {pending
                    ? t("adding")
                    : selectedVariant && !selectedVariant.availableForSale
                      ? t("outOfStock")
                      : t("addToCart")}
                </Button>
              </div>

              {added && (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium text-primary">
                  <CheckCircle2Icon className="size-4" />
                  {t("addedShort")}
                </p>
              )}
            </div>
          </div>
        )}

        {!loading && !product && open && (
          <p className="py-10 text-center text-sm text-muted-foreground">
            {t("quickAddError")}
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
}
