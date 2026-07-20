import { getUtmParams } from "./utm";
import type { TrackedItem, TrackedOrder } from "./types";

/**
 * Google Tag Manager adapter — GA4 e-commerce event names, pushed to the
 * dataLayer and enriched with stored UTM params. GTM itself is loaded lazily
 * (idle time) by initGtm; pushes before that queue in the dataLayer array.
 */

declare global {
  interface Window {
    dataLayer?: unknown[];
  }
}

export function pushToDataLayer(event: Record<string, unknown>): void {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const utm = getUtmParams();
  window.dataLayer.push(utm ? { ...utm, ...event } : event);
}

export function initGtm(gtmId: string): void {
  if (typeof window === "undefined" || document.getElementById("gtm-script"))
    return;

  window.dataLayer = window.dataLayer || [];
  // Consent Mode defaults — adjust (or wire to a consent banner) per market.
  // Consent commands need a real Arguments object; arrays are ignored.
  function gtag() {
    // eslint-disable-next-line prefer-rest-params
    window.dataLayer!.push(arguments);
  }
  (gtag as (...args: unknown[]) => void)("consent", "default", {
    ad_storage: "granted",
    ad_user_data: "granted",
    ad_personalization: "granted",
    analytics_storage: "granted",
  });
  window.dataLayer.push({ "gtm.start": Date.now(), event: "gtm.js" });

  const script = document.createElement("script");
  script.id = "gtm-script";
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtm.js?id=${gtmId}`;
  document.head.appendChild(script);
}

const gaItem = (item: TrackedItem) => ({
  item_id: item.id,
  item_name: item.name,
  price: item.price,
  ...(item.quantity !== undefined ? { quantity: item.quantity } : {}),
});

export function gtmPageView(path: string): void {
  pushToDataLayer({
    event: "page_view",
    page_title: document.title,
    page_location: window.location.href,
    page_path: path,
    language: navigator.language,
    page_referrer: document.referrer || null,
  });
}

export function gtmProductView(item: TrackedItem): void {
  pushToDataLayer({
    event: "view_item",
    ecommerce: {
      value: item.price,
      currency: item.currency,
      items: [gaItem(item)],
    },
  });
}

export function gtmAddToCart(item: TrackedItem): void {
  pushToDataLayer({
    event: "add_to_cart",
    ecommerce: {
      value: item.price * (item.quantity ?? 1),
      currency: item.currency,
      items: [gaItem(item)],
    },
  });
}

export function gtmRemoveFromCart(item: TrackedItem): void {
  pushToDataLayer({
    event: "remove_from_cart",
    ecommerce: {
      value: item.price * (item.quantity ?? 1),
      currency: item.currency,
      items: [gaItem(item)],
    },
  });
}

export function gtmBeginCheckout(
  items: TrackedItem[],
  value: number,
  currency: string,
): void {
  pushToDataLayer({
    event: "begin_checkout",
    ecommerce: { value, currency, items: items.map(gaItem) },
  });
}

export function gtmPurchase(order: TrackedOrder): void {
  pushToDataLayer({
    event: "purchase",
    ecommerce: {
      transaction_id: order.transactionId,
      ...(order.value !== undefined ? { value: order.value } : {}),
      ...(order.currency ? { currency: order.currency } : {}),
      ...(order.items ? { items: order.items.map(gaItem) } : {}),
    },
  });
}

export function gtmSearch(searchTerm: string, resultsCount?: number): void {
  pushToDataLayer({
    event: "search",
    search_term: searchTerm,
    ...(resultsCount !== undefined ? { results_count: resultsCount } : {}),
  });
}
