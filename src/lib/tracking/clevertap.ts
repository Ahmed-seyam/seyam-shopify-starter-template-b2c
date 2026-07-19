import type { TrackedItem, TrackedOrder } from "./types";

/**
 * CleverTap adapter. The SDK is dynamically imported on idle so it never
 * blocks first paint, and every call no-ops until init succeeds — a missing
 * or misconfigured account must never break the storefront.
 */

type CleverTap = {
  event: { push: (name: string, data?: Record<string, unknown>) => void };
  profile: { push: (payload: Record<string, unknown>) => void };
  onUserLogin: { push: (payload: Record<string, unknown>) => void };
  privacy: { push: (payload: Record<string, unknown>) => void };
  logout: () => void;
  init: (accountId: string, region?: string) => void;
  spa: boolean;
};

let clevertap: CleverTap | null = null;

export async function initCleverTap(
  accountId: string,
  region?: string,
): Promise<void> {
  if (clevertap || typeof window === "undefined") return;

  // Self-heal corrupted CleverTap storage: state lives under WZRK_* keys as
  // URL-encoded JSON; a corrupt value makes the SDK throw during init. Drop
  // entries that fail decode+parse so the SDK rebuilds them.
  try {
    for (const key of Object.keys(localStorage)) {
      if (!key.startsWith("WZRK_")) continue;
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      try {
        JSON.parse(decodeURIComponent(raw));
      } catch {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // localStorage unavailable — tracking is non-critical.
  }

  try {
    const { default: sdk } = await import("clevertap-web-sdk");
    sdk.init(accountId, region as never);
    sdk.privacy.push({ optOut: false });
    sdk.privacy.push({ useIP: true });
    sdk.spa = true;
    clevertap = sdk as unknown as CleverTap;
  } catch (error) {
    console.warn("[tracking] CleverTap init failed", error);
  }
}

function push(eventName: string, data?: Record<string, unknown>): void {
  clevertap?.event.push(eventName, data);
}

export function ctPageView(path: string): void {
  push("Page Viewed", {
    "Page Title": document.title,
    "Page URL": window.location.href,
    "Page Path": path,
  });
}

export function ctProductView(item: TrackedItem): void {
  push("Product Viewed", {
    "Product Name": item.name,
    "Product ID": item.id,
    "Product Price": item.price,
    Currency: item.currency,
  });
}

export function ctAddToCart(item: TrackedItem): void {
  push("Product Added", {
    "Product Name": item.name,
    "Product ID": item.id,
    "Product Price": item.price,
    Quantity: item.quantity ?? 1,
    Currency: item.currency,
  });
}

export function ctRemoveFromCart(item: TrackedItem): void {
  push("Product Removed", {
    "Product Name": item.name,
    "Product ID": item.id,
    Quantity: item.quantity ?? 1,
    Currency: item.currency,
  });
}

export function ctBeginCheckout(
  items: TrackedItem[],
  value: number,
  currency: string,
): void {
  push("Checkout Started", {
    "Cart Value": value,
    Currency: currency,
    "Item Count": items.length,
  });
}

export function ctPurchase(order: TrackedOrder): void {
  push("Charged", {
    "Transaction ID": order.transactionId,
    ...(order.value !== undefined ? { Amount: order.value } : {}),
    ...(order.currency ? { Currency: order.currency } : {}),
    ...(order.items
      ? {
          Items: order.items.map((item) => ({
            "Product Name": item.name,
            "Product ID": item.id,
            Price: item.price,
            Quantity: item.quantity ?? 1,
          })),
        }
      : {}),
  });
}

export function ctSearch(searchTerm: string, resultsCount?: number): void {
  push("Search", {
    "Search Query": searchTerm,
    ...(resultsCount !== undefined ? { "Results Count": resultsCount } : {}),
  });
}

/** Identify a signed-in customer (CleverTap merges the guest profile). */
export function ctSetUserProfile(profile: {
  id: string;
  name?: string;
  email?: string;
}): void {
  clevertap?.onUserLogin.push({
    Site: {
      Identity: profile.id,
      ...(profile.name ? { Name: profile.name } : {}),
      ...(profile.email ? { Email: profile.email } : {}),
      "User Type": "Registered",
    },
  });
}

export function ctLogout(): void {
  clevertap?.logout();
}
