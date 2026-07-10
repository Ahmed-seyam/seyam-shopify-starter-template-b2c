import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Separator } from "@/core/ui/separator";
import {
  AddToCartButton,
  getProduct,
  Price,
  ProductGallery,
  VariantSelector,
} from "@/domains/product";

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

  const [product, t] = await Promise.all([
    getProduct(handle, locale),
    getTranslations("product"),
  ]);
  if (!product) notFound();

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="grid gap-8 lg:grid-cols-2">
        <ProductGallery images={product.images} title={product.title} />

        <div className="flex flex-col gap-6">
          <div>
            <p className="text-sm text-muted-foreground">{product.vendor}</p>
            <h1 className="text-2xl font-bold">{product.title}</h1>
            <Price
              money={product.minPrice}
              compareAt={product.compareAtPrice}
              className="mt-2 text-xl"
            />
          </div>

          <VariantSelector
            options={product.options}
            variants={product.variants}
          />

          <AddToCartButton variants={product.variants} />

          {product.descriptionHtml && (
            <>
              <Separator />
              <section>
                <h2 className="mb-2 font-semibold">{t("description")}</h2>
                <div
                  className="prose prose-sm max-w-none text-muted-foreground"
                  // Trusted content: authored by the merchant in Shopify admin.
                  dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                />
              </section>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
