import { CheckCircle2Icon } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Button, Container, Heading, Text } from "@/core/ui";
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
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ order?: string }>;
}) {
  const [{ locale }, { order }] = await Promise.all([params, searchParams]);
  setRequestLocale(locale);
  const t = await getTranslations("checkout");

  return (
    <Container className="flex max-w-2xl flex-col items-center gap-4 py-24 text-center">
      <span className="flex size-14 items-center justify-center rounded-full bg-accent-light/25">
        <CheckCircle2Icon className="size-7 text-primary" />
      </span>
      <Heading level={1} className="text-3xl md:text-4xl">
        {t("thankYouTitle")}
      </Heading>
      {order && (
        <p className="text-sm font-medium text-muted-foreground">
          {t("orderNumber", { order })}
        </p>
      )}
      <Text variant="muted" className="max-w-md">
        {t("thankYouBody")}
      </Text>
      <Button asChild className="mt-4">
        <Link href="/">{t("continueShopping")}</Link>
      </Button>
    </Container>
  );
}
