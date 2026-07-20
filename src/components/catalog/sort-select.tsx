"use client";

import { useTranslations } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { SORT_VALUES, type SortValue } from "@/lib/client/catalog/params";
import { useCatalogUrl } from "./use-catalog-url";

export function SortSelect({ value }: { value: SortValue }) {
  const t = useTranslations("catalog.sort");
  const { patch } = useCatalogUrl();

  return (
    <Select
      value={value}
      onValueChange={(next) =>
        patch({ sort: next === "best-selling" ? undefined : next })
      }
    >
      <SelectTrigger aria-label={t("label")} className="w-44">
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {SORT_VALUES.map((option) => (
          <SelectItem key={option} value={option}>
            {t(option)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
