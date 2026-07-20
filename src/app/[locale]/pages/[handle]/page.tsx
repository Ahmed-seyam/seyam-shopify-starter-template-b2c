import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPage } from "@/app/[locale]/pages";

type PageProps = {
  params: Promise<{ locale: string; handle: string }>;
};

// Rendered on demand: content is fetched through the internal /api layer (a
// Server Component can't fetch a Route Handler while prerendering). The pages/*
// webhook topics still keep the data fresh via cache tags on /api/page/get-page.
export const dynamic = "force-dynamic";

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
