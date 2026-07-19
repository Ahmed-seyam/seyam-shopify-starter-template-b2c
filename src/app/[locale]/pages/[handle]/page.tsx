import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPage } from "@/app/[locale]/pages";

type PageProps = {
  params: Promise<{ locale: string; handle: string }>;
};

// No build-time params: pages materialize via ISR on first request and stay
// fresh through the pages/* webhook topics.
export function generateStaticParams(): Array<{ handle: string }> {
  return [];
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { locale, handle } = await params;
  const page = await getPage(handle, locale);
  if (!page) return {};

  return {
    title: page.seo?.title ?? page.title,
    description: page.seo?.description ?? page.bodySummary,
  };
}

export default async function ContentPage({ params }: PageProps) {
  const { locale, handle } = await params;
  setRequestLocale(locale);

  const page = await getPage(handle, locale);
  if (!page) notFound();

  return (
    <article className="prose prose-neutral dark:prose-invert mx-auto max-w-3xl px-4 py-12">
      <h1>{page.title}</h1>
      {/* Shopify sanitizes page body HTML server-side. */}
      <div dangerouslySetInnerHTML={{ __html: page.body }} />
    </article>
  );
}
