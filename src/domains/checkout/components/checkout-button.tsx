"use client";

import { useEffect, useRef, useState } from "react";
import { useLocale } from "next-intl";
import { Button } from "@/core/ui/button";
import { useRouter } from "@/i18n/navigation";
import type {
  CheckoutSnapshot,
  ShopifyCheckoutElement,
} from "../checkout-kit";

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
  const ref = useRef<ShopifyCheckoutElement>(null);
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

    const onComplete = (event: Event) => {
      const snapshot = (event as CustomEvent<{ checkout: CheckoutSnapshot }>)
        .detail?.checkout;
      const orderId = snapshot?.order?.id;
      // Hand off to our own branded confirmation — never Shopify's page.
      router.push(
        `/checkout/thank-you${orderId ? `?order=${encodeURIComponent(orderId)}` : ""}`,
        { locale },
      );
    };
    const onError = (event: Event) => {
      console.error(
        "checkout error",
        (event as CustomEvent<{ error: unknown }>).detail?.error,
      );
    };

    el.addEventListener("ec.complete", onComplete);
    el.addEventListener("ec.error", onError);
    return () => {
      el.removeEventListener("ec.complete", onComplete);
      el.removeEventListener("ec.error", onError);
    };
  }, [ready, router, locale]);

  return (
    <>
      {ready && (
        <shopify-checkout
          ref={ref}
          src={checkoutUrl}
          target="popup"
          appearance="storefront"
        />
      )}
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
