"use client";

import { XIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { CatalogParams } from "@/lib/client/catalog/params";
import { useCatalogUrl } from "./use-catalog-url";

export function ActiveFilterChips({ params }: { params: CatalogParams }) {
  const t = useTranslations("catalog.filters");
  const { patch } = useCatalogUrl();

  const chips: Array<{ key: string; label: string; clear: Record<string, undefined> }> = [];
  if (params.inStock) {
    chips.push({
      key: "available",
      label: t("inStockOnly"),
      clear: { available: undefined },
    });
  }
  if (params.priceMin !== undefined || params.priceMax !== undefined) {
    chips.push({
      key: "price",
      label: t("priceChip", {
        min: params.priceMin ?? 0,
        max: params.priceMax ?? "∞",
      }),
      clear: { min: undefined, max: undefined },
    });
  }

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      {chips.map((chip) => (
        <button
          key={chip.key}
          type="button"
          onClick={() => patch(chip.clear)}
          className="inline-flex cursor-pointer items-center gap-1.5 rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:border-foreground/40"
        >
          {chip.label}
          <XIcon aria-hidden className="size-3 text-muted-foreground" />
        </button>
      ))}
      <button
        type="button"
        onClick={() =>
          patch({ available: undefined, min: undefined, max: undefined })
        }
        className="cursor-pointer text-xs font-medium text-muted-foreground underline-offset-2 hover:underline"
      >
        {t("clearAll")}
      </button>
    </div>
  );
}
