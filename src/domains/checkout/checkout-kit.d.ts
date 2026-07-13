import type { DetailedHTMLProps, HTMLAttributes } from "react";

/**
 * Ambient typings for Shopify Checkout Kit's `<shopify-checkout>` custom
 * element (package `@shopify/checkout-kit`). The SDK ships as a side-effect
 * import that registers the element; it has no React wrapper, so we declare the
 * intrinsic element and the DOM interface ourselves.
 */

/** UCP checkout snapshot carried on `ec.*` event details (partial — we only
 * read `order.id` on completion; widen as needed). */
export interface CheckoutSnapshot {
  order?: { id?: string } | null;
  currency?: string;
  lineItems?: unknown;
  totals?: unknown;
}

export interface ShopifyCheckoutElement extends HTMLElement {
  src: string;
  target: "auto" | "popup" | "_blank";
  appearance: "storefront" | "app:light" | "app:dark" | "app:automatic";
  debug: boolean;
  checkout?: CheckoutSnapshot;
  error?: unknown;
  open(): void;
  close(): void;
  focus(): void;
}

type ShopifyCheckoutProps = DetailedHTMLProps<
  HTMLAttributes<ShopifyCheckoutElement>,
  ShopifyCheckoutElement
> & {
  src?: string;
  target?: "auto" | "popup" | "_blank";
  appearance?: "storefront" | "app:light" | "app:dark" | "app:automatic";
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "shopify-checkout": ShopifyCheckoutProps;
    }
  }
}
