import { defineRouting } from "next-intl/routing";
import { countries, languages } from "./locales.generated";

export { countries, languages };

/**
 * Locales are the language x market product (en-eg, ar-eg, …), synced from
 * Shopify via `npm run sync-locales`. The country lives in the URL because
 * pages are ISR-cached per URL — a cookie-based country would serve one
 * market's cached prices to another market's visitors.
 */
export const routing = defineRouting({
  locales: languages.flatMap((language) =>
    countries.map((country) => `${language.code}-${country.code}`),
  ),
  // First entries are the store's defaults (sync script puts them first).
  defaultLocale: `${languages[0].code}-${countries[0].code}`,
});

export type Locale = (typeof routing.locales)[number];

export function parseLocale(locale: string): {
  language: string;
  /** ISO country code (uppercase), undefined when the locale has no market. */
  country: string | undefined;
} {
  // The market is always the LAST segment — language codes themselves can
  // contain a region (pt-BR → locale "pt-br-eg").
  const segments = locale.split("-");
  const country = segments.length > 1 ? segments.pop() : undefined;
  return {
    language: segments.join("-") || "en",
    country: country?.toUpperCase(),
  };
}

const rtlLanguages: readonly string[] = ["ar", "he", "fa", "ur"];

export function dirForLocale(locale: string): "ltr" | "rtl" {
  return rtlLanguages.includes(parseLocale(locale).language) ? "rtl" : "ltr";
}
