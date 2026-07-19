"use client";

import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui";
import { usePathname, useRouter } from "@/i18n/navigation";
import { countries, languages, parseLocale } from "@/i18n/routing";

/**
 * Switches the language (synced from Shopify), preserving the market,
 * path and query.
 */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (languages.length < 2) return null;

  const { language, country } = parseLocale(locale);
  const market = country?.toLowerCase() ?? countries[0].code;

  return (
    <Select
      value={language}
      onValueChange={(code) => {
        const query = searchParams.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          locale: `${code}-${market}`,
        });
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-auto gap-1 border-none shadow-none"
        aria-label="Select language"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {languages.map(({ code, label }) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
