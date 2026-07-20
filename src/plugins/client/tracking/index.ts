import * as GTM from "./gtm";
import * as CT from "./clevertap";
import { insightsConversion } from "./insights";
import type { TrackedItem, TrackedOrder } from "./types";

export { captureUtmParams } from "./utm";
export { initGtm } from "./gtm";
export { initCleverTap, ctSetUserProfile, ctLogout } from "./clevertap";
export { insightsClient, insightsConversion, rememberQueryId } from "./insights";
export {
  itemFromProduct,
  itemFromCartLine,
  cartSummary,
  type TrackedItem,
  type TrackedOrder,
} from "./types";

/**
 * Tracking facade — call sites use `track.*`; each call fans out to every
 * configured vendor (GTM dataLayer, CleverTap; Algolia Insights events flow
 * separately through the InstantSearch middleware). Everything no-ops on the
 * server, when NEXT_PUBLIC_ENABLE_TRACKING=false, or for vendors that were
 * never initialized — tracking must never break the store.
 */

function enabled(): boolean {
  return (
    typeof window !== "undefined" &&
    process.env.NEXT_PUBLIC_ENABLE_TRACKING !== "false"
  );
}

export const track = {
  pageView(path: string): void {
    if (!enabled()) return;
    GTM.gtmPageView(path);
    CT.ctPageView(path);
  },
  productView(item: TrackedItem): void {
    if (!enabled()) return;
    GTM.gtmProductView(item);
    CT.ctProductView(item);
  },
  addToCart(item: TrackedItem): void {
    if (!enabled()) return;
    GTM.gtmAddToCart(item);
    CT.ctAddToCart(item);
    // Algolia conversion (search-attributed when a hit click preceded it) —
    // the relay no-ops server-side when the Algolia provider isn't configured.
    if (item.handle) insightsConversion(item.handle);
  },
  removeFromCart(item: TrackedItem): void {
    if (!enabled()) return;
    GTM.gtmRemoveFromCart(item);
    CT.ctRemoveFromCart(item);
  },
  beginCheckout(items: TrackedItem[], value: number, currency: string): void {
    if (!enabled()) return;
    GTM.gtmBeginCheckout(items, value, currency);
    CT.ctBeginCheckout(items, value, currency);
  },
  purchase(order: TrackedOrder): void {
    if (!enabled()) return;
    GTM.gtmPurchase(order);
    CT.ctPurchase(order);
  },
  search(searchTerm: string, resultsCount?: number): void {
    if (!enabled()) return;
    GTM.gtmSearch(searchTerm, resultsCount);
    CT.ctSearch(searchTerm, resultsCount);
  },
};
