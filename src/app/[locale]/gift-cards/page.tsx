import type { Metadata } from "next";
import { GiftIcon, MailIcon, WalletIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  Card,
  CardContent,
  Container,
  EmptyState,
  Eyebrow,
  Heading,
  ImageFrame,
  Text,
} from "@/components/ui";
import { GiftCardForm } from "@/components/gift-cards/gift-card-form";
import { getProduct } from "@/app/[locale]/products/_actions/get-product";

// Rendered on demand: the gift-card product is fetched through the internal
// /api layer (a Server Component can't fetch a Route Handler while prerendering).
export const dynamic = "force-dynamic";

// Shopify's built-in gift card product ships with this handle.
const GIFT_CARD_HANDLE = "gift-card";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("giftCards");
  return { title: t("title") };
}

export default async function GiftCardsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("giftCards");

  const product = await getProduct(GIFT_CARD_HANDLE, locale);

  const steps = [
    { icon: WalletIcon, key: 1 },
    { icon: MailIcon, key: 2 },
    { icon: GiftIcon, key: 3 },
  ] as const;

  return (
    <>
      {/* Dark hero band per spec #s-giftcards. */}
      <section className="bg-foreground text-background">
        <Container className="grid items-center gap-10 py-14 lg:grid-cols-2 lg:py-20">
          <div className="max-w-xl">
            <Eyebrow className="mb-4 text-background/70">{t("title")}</Eyebrow>
            <Heading level={1} className="mb-4 text-background">
              {t("heroTitle")}
            </Heading>
            <Text className="text-background/80">{t("heroSubtitle")}</Text>
          </div>
          <ImageFrame
            src={product?.featuredImage?.url}
            alt={product?.featuredImage?.altText ?? t("title")}
            ratio="landscape"
            radius="xl"
            sizes="(min-width: 1024px) 40rem, 100vw"
            className="w-full"
          />
        </Container>
      </section>

      <Container className="py-12 lg:py-16">
        <div className="mx-auto max-w-xl">
          {product ? (
            <GiftCardForm product={product} />
          ) : (
            <EmptyState
              icon={<GiftIcon />}
              title={t("unavailable")}
              description={t("unavailableHint")}
            />
          )}
        </div>
      </Container>

      <section className="border-t border-border bg-surface">
        <Container className="py-12 lg:py-16">
          <Heading level={2} className="mb-8 text-center">
            {t("howTitle")}
          </Heading>
          <div className="grid gap-4 sm:grid-cols-3">
            {steps.map(({ icon: Icon, key }) => (
              <Card key={key}>
                <CardContent className="flex flex-col items-center gap-3 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full bg-secondary text-foreground">
                    <Icon className="size-5" aria-hidden />
                  </span>
                  <span className="font-medium text-foreground">
                    {t(`step${key}Title`)}
                  </span>
                  <Text variant="muted" className="text-sm">
                    {t(`step${key}Body`)}
                  </Text>
                </CardContent>
              </Card>
            ))}
          </div>
        </Container>
      </section>
    </>
  );
}
