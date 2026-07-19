import type { Metadata } from "next";
import { IBM_Plex_Sans_Arabic, Newsreader, Public_Sans } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { ThemeProvider } from "@/components/layout/theme-provider";
import { Toaster } from "@/components/ui";
import { dirForLocale, routing } from "@/i18n/routing";
import "../globals.css";

const publicSans = Public_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
  display: "swap",
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const arabicSans = IBM_Plex_Sans_Arabic({
  variable: "--font-arabic",
  subsets: ["arabic"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Starter Store",
    template: "%s | Starter Store",
  },
  description: "Shopify B2C starter storefront — Next.js + Storefront API.",
};

// Empty on purpose: builds must succeed without store credentials
// (store-independent Docker images). Its presence still opts routes into
// static/ISR rendering — pages generate and cache on first request.
export function generateStaticParams(): Array<{ locale: string }> {
  return [];
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);

  const dir = dirForLocale(locale);

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${publicSans.variable} ${newsreader.variable} ${arabicSans.variable} h-full antialiased`}
      // ThemeProvider's pre-paint script mutates the class on <html> before
      // hydration; suppress the resulting attribute mismatch warning.
      suppressHydrationWarning
    >
      <body
        className={`flex min-h-full flex-col ${
          dir === "rtl" ? "font-[family-name:var(--font-arabic)]" : ""
        }`}
      >
        <ThemeProvider>
          <NextIntlClientProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <Toaster />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
