"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  useRange,
  useRefinementList,
  useToggleRefinement,
} from "react-instantsearch";
import { Button, Checkbox, Input, Label } from "@/components/ui";
import { searchFacets, type FacetConfig } from "./facets";

/** Renders the facet config: one control per entry, chosen by `type`. */

function ListFacet({ facet }: { facet: FacetConfig }) {
  const t = useTranslations("catalog.filters");
  const { items, refine, canToggleShowMore, isShowingMore, toggleShowMore } =
    useRefinementList({
      attribute: facet.attribute,
      limit: facet.limit,
      showMore: facet.showMore,
      showMoreLimit: facet.showMoreLimit,
    });

  if (items.length === 0) return null;

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-foreground">{t(facet.labelKey)}</p>
      <ul className="grid gap-2">
        {items.map((item) => (
          <li key={item.value}>
            <Label className="cursor-pointer font-normal text-body">
              <Checkbox
                checked={item.isRefined}
                onCheckedChange={() => refine(item.value)}
              />
              <span className="flex-1">{item.label}</span>
              <span className="text-xs text-muted-foreground">
                {item.count}
              </span>
            </Label>
          </li>
        ))}
      </ul>
      {canToggleShowMore && (
        <button
          type="button"
          onClick={toggleShowMore}
          className="cursor-pointer text-start text-xs font-medium text-primary hover:underline"
        >
          {isShowingMore ? t("showLess") : t("showMore")}
        </button>
      )}
    </div>
  );
}

function BooleanFacet({ facet }: { facet: FacetConfig }) {
  const t = useTranslations("catalog.filters");
  const { value, refine } = useToggleRefinement({
    attribute: facet.attribute,
    on: true,
  });

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-foreground">
        {t("availability")}
      </p>
      <Label className="cursor-pointer font-normal text-body">
        <Checkbox
          checked={value.isRefined}
          onCheckedChange={() => refine(value)}
        />
        <span className="flex-1">{t(facet.labelKey)}</span>
        {value.onFacetValue.count !== null && (
          <span className="text-xs text-muted-foreground">
            {value.onFacetValue.count}
          </span>
        )}
      </Label>
    </div>
  );
}

function RangeFacet({ facet }: { facet: FacetConfig }) {
  const t = useTranslations("catalog.filters");
  const { start, refine } = useRange({ attribute: facet.attribute });
  const [min, setMin] = useState("");
  const [max, setMax] = useState("");

  const bound = (value: number | undefined) =>
    value !== undefined && Number.isFinite(value) ? String(value) : "";

  return (
    <div className="grid gap-3">
      <p className="text-sm font-semibold text-foreground">{t(facet.labelKey)}</p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          inputMode="numeric"
          min={0}
          placeholder={t("min")}
          aria-label={t("min")}
          value={min || bound(start[0] === -Infinity ? undefined : start[0])}
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
          value={max || bound(start[1] === Infinity ? undefined : start[1])}
          onChange={(event) => setMax(event.target.value)}
          className="h-10"
        />
      </div>
      <Button
        variant="secondary"
        size="sm"
        onClick={() =>
          refine([min ? Number(min) : undefined, max ? Number(max) : undefined])
        }
      >
        {t("apply")}
      </Button>
    </div>
  );
}

export function FacetPanel() {
  return (
    <div className="grid gap-6">
      {searchFacets.map((facet) => {
        switch (facet.type) {
          case "list":
            return <ListFacet key={facet.attribute} facet={facet} />;
          case "boolean":
            return <BooleanFacet key={facet.attribute} facet={facet} />;
          case "range":
            return <RangeFacet key={facet.attribute} facet={facet} />;
        }
      })}
    </div>
  );
}
