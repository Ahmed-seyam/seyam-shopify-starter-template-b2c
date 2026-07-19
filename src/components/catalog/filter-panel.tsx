"use client";

import { SlidersHorizontalIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  BottomSheet,
  BottomSheetContent,
  BottomSheetTitle,
  BottomSheetTrigger,
  Button,
  Checkbox,
  Input,
  Label,
} from "@/core/ui";
import type { CatalogParams } from "./catalog-params";
import { useCatalogUrl } from "./use-catalog-url";

/** Filter controls (in-stock, price range) — desktop sidebar + mobile bottom sheet. */
function FilterControls({
  params,
  onApplied,
}: {
  params: CatalogParams;
  onApplied?: () => void;
}) {
  const t = useTranslations("catalog.filters");
  const { patch } = useCatalogUrl();
  const [min, setMin] = useState(params.priceMin?.toString() ?? "");
  const [max, setMax] = useState(params.priceMax?.toString() ?? "");

  const applyPrice = () => {
    patch({ min: min || undefined, max: max || undefined });
    onApplied?.();
  };

  return (
    <div className="grid gap-6">
      <div className="grid gap-3">
        <p className="text-sm font-semibold text-foreground">
          {t("availability")}
        </p>
        <Label className="cursor-pointer font-normal text-body">
          <Checkbox
            checked={params.inStock}
            onCheckedChange={(checked) => {
              patch({ available: checked === true ? "1" : undefined });
              onApplied?.();
            }}
          />
          {t("inStockOnly")}
        </Label>
      </div>

      <div className="grid gap-3">
        <p className="text-sm font-semibold text-foreground">{t("price")}</p>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t("min")}
            aria-label={t("min")}
            value={min}
            onChange={(event) => setMin(event.target.value)}
            className="h-10"
          />
          <span aria-hidden className="text-muted-foreground">
            –
          </span>
          <Input
            type="number"
            inputMode="numeric"
            min={0}
            placeholder={t("max")}
            aria-label={t("max")}
            value={max}
            onChange={(event) => setMax(event.target.value)}
            className="h-10"
          />
        </div>
        <Button variant="secondary" size="sm" onClick={applyPrice}>
          {t("apply")}
        </Button>
      </div>
    </div>
  );
}

/** Desktop sidebar. */
export function FilterPanel({ params }: { params: CatalogParams }) {
  const t = useTranslations("catalog.filters");

  return (
    <aside className="hidden w-60 shrink-0 lg:block">
      <p className="mb-5 font-serif text-lg font-medium text-foreground">
        {t("title")}
      </p>
      <FilterControls params={params} />
    </aside>
  );
}

/** Mobile trigger + bottom sheet. */
export function MobileFilters({ params }: { params: CatalogParams }) {
  const t = useTranslations("catalog.filters");
  const [open, setOpen] = useState(false);

  return (
    <BottomSheet open={open} onOpenChange={setOpen}>
      <BottomSheetTrigger asChild>
        <Button variant="secondary" size="sm" className="lg:hidden">
          <SlidersHorizontalIcon />
          {t("title")}
        </Button>
      </BottomSheetTrigger>
      <BottomSheetContent className="p-6">
        <BottomSheetTitle className="mb-4">{t("title")}</BottomSheetTitle>
        <FilterControls params={params} onApplied={() => setOpen(false)} />
      </BottomSheetContent>
    </BottomSheet>
  );
}
