"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import type {
  ShopifyCheckout,
  ShopifyCheckoutCompleteEvent,
  ShopifyCheckoutErrorEvent,
} from "@shopify/checkout-kit";
import { Button } from "@/app/core/ui";
// Import the Server Action from its 'use server' file directly — never via the
// cart domain barrel, which re-exports server-only fetchers.
import { clearCart } from "@/app/[locale]/cart/actions/clear-cart";
import { useRouter } from "@/i18n/navigation";

type CheckoutMode = "redirect" | "embedded";

type Props = {
  /** Shopify-hosted checkout URL from the cart (cart.checkoutUrl). */
  checkoutUrl: string;
  /** Server-resolved env.CHECKOUT_MODE — the client never reads env directly. */
  mode: CheckoutMode;
  /** Localized button label (t("checkout")). */
  label: string;
};

/**
 * Checkout entry point. In "redirect" mode this is a plain link to Shopify's
 * hosted checkout. In "embedded" mode it mounts Checkout Kit's
 * `<shopify-checkout>` overlay so the buyer never leaves the site.
 *
 * The signed-in customer is prefilled/attributed via the cart's
 * buyerIdentity.customerAccessToken regardless of mode — this component only
 * controls presentation, not identity.
 */
export function CheckoutButton({ checkoutUrl, mode, label }: Props) {
  if (mode === "embedded") {
    return <EmbeddedCheckout checkoutUrl={checkoutUrl} label={label} />;
  }

  return (
    <Button size="lg" className="mt-6 w-full" asChild>
      {/* Checkout is always Shopify-hosted — payments never touch this app. */}
      <a href={checkoutUrl}>{label}</a>
    </Button>
  );
}

function EmbeddedCheckout({
  checkoutUrl,
  label,
}: Pick<Props, "checkoutUrl" | "label">) {
  const ref = useRef<ShopifyCheckout>(null);
  const router = useRouter();
  const locale = useLocale();
  // The custom element only exists after the SDK's side-effect import runs in
  // the browser; render it (and enable the button) once registered.
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    import("@shopify/checkout-kit").then(() => {
      if (!cancelled) setReady(true);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Real event names are `checkout:*` (the SDK's DOM events). The `ec.*`
    // names in some docs are the internal ECP wire methods and never reach the
    // DOM. Handlers are cast to EventListener because TS sees the custom
    // element as a plain HTMLElement.
    const onComplete = (event: ShopifyCheckoutCompleteEvent) => {
      const orderId = event.detail?.order?.id;
      // The order is placed — Shopify converted the cart, so forget our cart
      // cookie and refresh the badge before leaving, otherwise the purchased
      // items linger until a manual reload.
      void clearCart().then(() => {
        window.dispatchEvent(new Event("cart:updated"));
        // Hand off to our own branded confirmation — never Shopify's page.
        router.push(
          `/checkout/thank-you${orderId ? `?order=${encodeURIComponent(orderId)}` : ""}`,
          { locale },
        );
      });
    };
    const onError = (event: ShopifyCheckoutErrorEvent) => {
      console.error("checkout error", event.detail?.error);
    };

    // One AbortController removes every listener on cleanup.
    const controller = new AbortController();
    const { signal } = controller;
    el.addEventListener("checkout:complete", onComplete as EventListener, {
      signal,
    });
    el.addEventListener("checkout:error", onError as EventListener, { signal });
    return () => controller.abort();
  }, [ready, router, locale]);

  return (
    <>
      {ready && <shopify-checkout ref={ref} src={checkoutUrl} target="popup" />}
      <Button
        size="lg"
        className="mt-6 w-full"
        disabled={!ready}
        onClick={() => ref.current?.open()}
      >
        {label}
      </Button>
    </>
  );
}
