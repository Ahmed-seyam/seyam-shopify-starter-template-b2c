import { routing } from "@/i18n/routing";

/**
 * A redirect/target locale must be one the app actually serves — otherwise a
 * crafted `locale` form field becomes an open redirect / bogus path. Anything
 * unrecognised falls back to the default locale. Isomorphic: safe to call from
 * Server Actions and client components alike.
 */
export function safeLocale(value: FormDataEntryValue | null | undefined): string {
  const locale = typeof value === "string" ? value : "";
  return (routing.locales as readonly string[]).includes(locale)
    ? locale
    : routing.defaultLocale;
}
