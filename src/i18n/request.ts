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

  return {
    locale,
    messages: (await import(`../../messages/${language}.json`)).default,
  };
});
