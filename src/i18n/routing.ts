import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["en", "ar"],
  defaultLocale: "en",
});

export type Locale = (typeof routing.locales)[number];

export const rtlLocales: readonly string[] = ["ar"];

export function dirForLocale(locale: string): "ltr" | "rtl" {
  return rtlLocales.includes(locale) ? "rtl" : "ltr";
}
