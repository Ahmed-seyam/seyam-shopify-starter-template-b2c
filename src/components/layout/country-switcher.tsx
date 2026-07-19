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
import { countries, parseLocale } from "@/i18n/routing";

/**
 * Switches the market (country segment of the locale, /en-eg → /en-us),
 * preserving language, path and query. Pages re-render with the new
 * market's @inContext pricing.
 */
export function CountrySwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { language, country } = parseLocale(locale);
  const current = country?.toLowerCase() ?? countries[0].code;

  return (
    <Select
      value={current}
      onValueChange={(code) => {
        const query = searchParams.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          locale: `${language}-${code}`,
        });
      }}
    >
      <SelectTrigger
        size="sm"
        className="w-auto gap-1 border-none shadow-none"
        aria-label="Select market"
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent align="end">
        {countries.map(({ code, label }) => (
          <SelectItem key={code} value={code}>
            {label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
