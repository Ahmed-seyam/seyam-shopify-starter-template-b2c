import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Suspense } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
  Breadcrumbs,
  Container,
  Heading,
  Price,
} from "@/app/core/ui";
import {
  getProduct,
  ProductGallery,
  VariantSelector,
} from "@/app/[locale]/products";
import { PurchasePanel } from "@/app/[locale]/products/components/purchase-panel";
import { RelatedProducts } from "@/app/[locale]/products/components/related-products";
import { ReviewsSection } from "@/app/[locale]/products/components/reviews-section";

type PageProps = {
  params: Promise<{ locale: string; handle: string }>;
};

// No build-time params: images stay store-independent (Docker) and pages
// materialize via ISR on first request. Webhooks keep them fresh.
export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const product = await getProduct(handle, locale);
  if (!product) return {};

  return {
    title: product.seo.title ?? product.title,
    description: product.seo.description ?? undefined,
    openGraph: product.featuredImage
      ? { images: [{ url: product.featuredImage.url }] }
      : undefined,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const [product, t, tLayout] = await Promise.all([
    getProduct(handle, locale),
    getTranslations("product"),
    getTranslations("layout"),
  ]);
  if (!product) notFound();

  return (
    <Container className="py-8">
      <Breadcrumbs
        items={[
          { label: tLayout("home"), href: "/" },
          { label: product.title },
        ]}
        className="mb-6"
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-6">
          <div className="grid gap-2">
            {product.vendor && (
              <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
                {product.vendor}
              </p>
            )}
            <Heading level={2} asChild>
              <h1>{product.title}</h1>
            </Heading>
            <a
              href="#reviews"
              className="text-sm text-muted-foreground underline-offset-2 hover:underline"
            >
              {t("reviewsAnchor")}
            </a>
            <Price
              money={product.minPrice}
              compareAt={product.compareAtPrice}
              className="text-xl"
            />
          </div>

          <Suspense>
            <VariantSelector
              options={product.options}
              variants={product.variants}
            />
          </Suspense>
          <Suspense>
            <PurchasePanel
              handle={product.handle}
              title={product.title}
              variants={product.variants}
            />
          </Suspense>

          <Accordion
            type="multiple"
            defaultValue={["details"]}
            className="border-t border-border"
          >
            {product.descriptionHtml && (
              <AccordionItem value="details">
                <AccordionTrigger>{t("description")}</AccordionTrigger>
                <AccordionContent>
                  <div
                    className="prose prose-sm max-w-none text-body"
                    // Trusted content: authored by the merchant in Shopify admin.
                    dangerouslySetInnerHTML={{
                      __html: product.descriptionHtml,
                    }}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
            <AccordionItem value="shipping">
              <AccordionTrigger>{t("shippingTitle")}</AccordionTrigger>
              <AccordionContent>{t("shippingBody")}</AccordionContent>
            </AccordionItem>
            <AccordionItem value="care">
              <AccordionTrigger>{t("careTitle")}</AccordionTrigger>
              <AccordionContent>{t("careBody")}</AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      <div className="mt-14 grid gap-14">
        <ReviewsSection productTitle={product.title} />
        <RelatedProducts currentHandle={product.handle} locale={locale} />
      </div>
    </Container>
  );
}
