import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import { parseLocale, routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested)
    ? requested
    : routing.defaultLocale;

  // Messages are per language — all markets of a language share them.
  const { language } = parseLocale(locale);

  // Languages come from Shopify (sync-locales); a language without its own
  // messages/<code>.json falls back to English until one is added.
  let messages;
  try {
    messages = (await import(`../../messages/${language}.json`)).default;
  } catch {
    messages = (await import(`../../messages/en.json`)).default;
  }

  return { locale, messages };
});
