import type { Metadata } from "next";
import Image from "next/image";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import { getCart } from "@/domains/cart";
import { CartLineControls } from "@/domains/cart/components/cart-line-controls";
import { Price } from "@/domains/product";
import { Link } from "@/i18n/navigation";

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

  const [cart, t] = await Promise.all([
    getCart(locale),
    getTranslations("cart"),
  ]);

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("empty")}</p>
        <Button asChild>
          <Link href="/">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <ul className="flex flex-col gap-4">
        {cart.lines.map((line) => (
          <li key={line.id} className="flex gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {line.merchandise.image && (
                <Image
                  src={line.merchandise.image.url}
                  alt={
                    line.merchandise.image.altText ??
                    line.merchandise.product.title
                  }
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/products/${line.merchandise.product.handle}`}
                className="font-medium hover:underline"
              >
                {line.merchandise.product.title}
              </Link>
              {line.merchandise.title !== "Default Title" && (
                <span className="text-sm text-muted-foreground">
                  {line.merchandise.title}
                </span>
              )}
              <div className="mt-auto flex items-center justify-between">
                <CartLineControls
                  lineId={line.id}
                  quantity={line.quantity}
                  removeLabel={t("remove")}
                />
                <Price money={line.cost.totalAmount} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Separator className="my-6" />

      <div className="flex items-center justify-between text-lg font-semibold">
        <span>{t("subtotal")}</span>
        <Price money={cart.cost.subtotalAmount} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("taxNote")}</p>

      <Button size="lg" className="mt-6 w-full" asChild>
        {/* Checkout is always Shopify-hosted — payments never touch this app. */}
        <a href={cart.checkoutUrl}>{t("checkout")}</a>
      </Button>
    </div>
  );
}
