import { defineRouting } from "next-intl/routing";

export const languages = ["en", "ar"] as const;

/**
 * Markets selectable from the UI. The country goes in the URL
 * (/en-eg/…) because pages are ISR-cached per URL — a cookie-based country
 * would serve one market's cached prices to another market's visitors.
 * Must match markets enabled in Shopify admin (Settings → Markets),
 * otherwise Shopify falls back to the default market's pricing.
 */
export const countries = [
  { code: "eg", label: "Egypt (EGP)" },
  { code: "us", label: "United States (USD)" },
] as const;

export const routing = defineRouting({
  // Cartesian product: en-eg, ar-eg, en-us, ar-us …
  locales: languages.flatMap((language) =>
    countries.map((country) => `${language}-${country.code}`),
  ),
  defaultLocale: "en-eg",
});

export type Locale = (typeof routing.locales)[number];

export function parseLocale(locale: string): {
  language: string;
  /** ISO country code (uppercase), undefined when the locale has no region. */
  country: string | undefined;
} {
  const [language = "en", country] = locale.split("-");
  return { language, country: country?.toUpperCase() };
}

const rtlLanguages: readonly string[] = ["ar"];

export function dirForLocale(locale: string): "ltr" | "rtl" {
  return rtlLanguages.includes(parseLocale(locale).language) ? "rtl" : "ltr";
}
