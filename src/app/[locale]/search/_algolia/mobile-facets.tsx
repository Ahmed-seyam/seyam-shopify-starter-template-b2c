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
} from "@/components/ui";
import { FacetPanel } from "./facet-panel";

/** Mobile trigger + bottom sheet for the facet panel. */
export function MobileFacets() {
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
        <FacetPanel />
      </BottomSheetContent>
    </BottomSheet>
  );
}
