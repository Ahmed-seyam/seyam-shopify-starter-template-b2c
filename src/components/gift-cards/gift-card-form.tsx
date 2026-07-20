"use client";

import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Button, Field, formatMoney, Input, Textarea, toast } from "@/components/ui";
import { addToCart } from "@/app/[locale]/cart/_actions/add-to-cart";
import { OptionPill } from "@/app/[locale]/products/_components/option-pill";
import type { Product } from "@/types/product";

/**
 * Amount picker + recipient details for the store's gift-card product.
 * Amounts are the product's variants (denominations are store-defined, so
 * there's no free-form amount); recipient fields travel as line attributes
 * visible at checkout and in the order.
 */
export function GiftCardForm({ product }: { product: Product }) {
  const t = useTranslations("giftCards");
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  const variants = product.variants;
  const [variantId, setVariantId] = useState(
    () => (variants.find((v) => v.availableForSale) ?? variants[0])?.id
  );
  const selected = variants.find((v) => v.id === variantId);

  return (
    <form
      className="flex flex-col gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        if (!selected) return;
        const data = new FormData(event.currentTarget);
        const email = String(data.get("recipientEmail") ?? "").trim();
        const message = String(data.get("message") ?? "").trim();
        const attributes = [
          ...(email ? [{ key: "Recipient email", value: email }] : []),
          ...(message ? [{ key: "Gift message", value: message }] : []),
        ];
        startTransition(async () => {
          try {
            await addToCart(selected.id, 1, locale, attributes);
            window.dispatchEvent(new Event("cart:updated"));
            toast.success(t("added"));
          } catch {
            toast.error(t("addFailed"));
          }
        });
      }}
    >
      <fieldset className="flex flex-col gap-3">
        <legend className="mb-3 text-sm font-medium text-foreground">
          {t("amountLabel")}
        </legend>
        <div className="flex flex-wrap gap-2">
          {variants.map((variant) => (
            <OptionPill
              key={variant.id}
              selected={variant.id === variantId}
              unavailable={!variant.availableForSale}
              disabled={!variant.availableForSale}
              onClick={() => setVariantId(variant.id)}
            >
              {formatMoney(variant.price, locale)}
            </OptionPill>
          ))}
        </div>
      </fieldset>

      <Field
        label={t("recipientEmail")}
        htmlFor="gift-email"
        hint={t("recipientHint")}
      >
        <Input
          id="gift-email"
          name="recipientEmail"
          type="email"
          autoComplete="off"
        />
      </Field>

      <Field label={t("message")} htmlFor="gift-message">
        <Textarea
          id="gift-message"
          name="message"
          rows={3}
          maxLength={300}
        />
      </Field>

      <Button
        type="submit"
        size="lg"
        disabled={pending || !selected}
        className="w-full sm:w-auto"
      >
        {pending
          ? t("adding")
          : selected
            ? t("addToCart", { price: formatMoney(selected.price, locale) })
            : t("unavailable")}
      </Button>
    </form>
  );
}
