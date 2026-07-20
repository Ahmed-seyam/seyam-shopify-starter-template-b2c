"use client";

import { useEffect } from "react";
import { track, type TrackedItem } from "@/plugins/client/tracking";

/** Fires view_item once per product page visit (rendered by the PDP). */
export function TrackProductView({ item }: { item: TrackedItem }) {
  useEffect(() => {
    track.productView(item);
    // Re-fire only when navigating to a different product.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item.id]);

  return null;
}
