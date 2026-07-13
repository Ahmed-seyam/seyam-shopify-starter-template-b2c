import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button } from "@/core/ui/button";
import { Link } from "@/i18n/navigation";

// Confirmation lands here after Checkout Kit's embedded checkout fires
// `ec.complete` (embedded mode). The order is already placed in Shopify — this
// is a branded on-site thank-you, not an order-status source of truth.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("checkout");
  return { title: t("thankYouTitle") };
}

export default async function ThankYouPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center gap-4 px-4 py-24 text-center">
      <h1 className="text-3xl font-bold">{t("thankYouTitle")}</h1>
      <p className="text-muted-foreground">{t("thankYouBody")}</p>
      <Button asChild className="mt-4">
        <Link href="/">{t("continueShopping")}</Link>
      </Button>
    </div>
  );
}
