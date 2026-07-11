import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCart } from "@/domains/cart";
import { CartView } from "@/domains/cart/components/cart-view";

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

  const cart = await getCart(locale);

  // CartView owns all cart state so line edits apply optimistically (no
  // full-page refresh) and reconcile with each mutation's returned cart.
  return <CartView initialCart={cart} />;
}
