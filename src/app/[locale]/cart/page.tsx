import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { env } from "@/core/config/env";
import { getCart } from "@/domains/cart";
import { CartPageView } from "@/domains/cart/components/cart-page-view";

// Cart reads the session cookie — always rendered per request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("cart");
  return { title: t("title") };
}

export default async function CartPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  // syncBuyerCountry reprices the cart when the user switched markets since
  // it was created (cart currency is pinned to its buyerIdentity).
  const cart = await getCart(locale, { syncBuyerCountry: true });

  // CartView owns all cart state so line edits apply optimistically (no
  // full-page refresh) and reconcile with each mutation's returned cart.
  // checkoutMode is resolved server-side (env is server-only) and passed down
  // so the checkout button can mount the embedded overlay or a plain link.
  return <CartPageView initialCart={cart} checkoutMode={env().CHECKOUT_MODE} />;
}
