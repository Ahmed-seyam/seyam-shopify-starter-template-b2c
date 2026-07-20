"use client";

import { useEffect } from "react";
import { track } from "@/plugins/client/tracking";

/**
 * Fires the purchase event on the thank-you page, deduplicated per order via
 * sessionStorage (refreshes must not double-count revenue). Only the order
 * number survives the redirect from Shopify checkout, so value/items are
 * omitted — enrich server-side via the orders webhook if you need amounts.
 */
export function TrackPurchase({ orderNumber }: { orderNumber: string }) {
  useEffect(() => {
    const key = `purchase_tracked_${orderNumber}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {
      // Session storage unavailable — accept possible duplicates.
    }
    track.purchase({ transactionId: orderNumber });
  }, [orderNumber]);

  return null;
}
