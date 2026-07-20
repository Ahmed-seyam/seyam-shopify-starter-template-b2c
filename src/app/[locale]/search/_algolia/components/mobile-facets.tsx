"use client";

import { MobileFilterSheet } from "@/components/catalog/filter-panel";
import { FacetPanel } from "./facet-panel";

/** Mobile trigger + bottom sheet for the facet panel. */
export function MobileFacets() {
  return <MobileFilterSheet>{() => <FacetPanel />}</MobileFilterSheet>;
}
