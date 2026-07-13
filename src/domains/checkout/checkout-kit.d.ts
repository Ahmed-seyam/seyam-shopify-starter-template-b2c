import type { DetailedHTMLProps, HTMLAttributes } from "react";
import type { ShopifyCheckout, CheckoutTarget } from "@shopify/checkout-kit";

/**
 * JSX typing for Shopify Checkout Kit's `<shopify-checkout>` custom element.
 * The SDK ships the element class + event types (`ShopifyCheckout`,
 * `ShopifyCheckout*Event`) but no React wrapper, so we map the intrinsic
 * element to its real attributes here. Attributes are limited to what this
 * SDK version actually supports: `src`, `target`, `debug` (no `appearance`).
 */
type ShopifyCheckoutProps = DetailedHTMLProps<
  HTMLAttributes<ShopifyCheckout>,
  ShopifyCheckout
> & {
  src?: string;
  target?: CheckoutTarget;
  debug?: boolean;
};

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "shopify-checkout": ShopifyCheckoutProps;
    }
  }
}
