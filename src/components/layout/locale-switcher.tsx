"use client";

import { GlobeIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/core/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { countries, languages, parseLocale } from "@/i18n/routing";

const LANGUAGE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
};

/** Toggles the language, preserving the market, path and query. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const { language, country } = parseLocale(locale);
  const otherLanguage = languages.find(
    (candidate) => candidate !== language,
  );
  if (!otherLanguage) return null;

  const other = `${otherLanguage}-${country?.toLowerCase() ?? countries[0].code}`;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Switch language to ${LANGUAGE_LABELS[otherLanguage] ?? otherLanguage}`}
      onClick={() => {
        const query = searchParams.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          locale: other,
        });
      }}
    >
      <GlobeIcon className="size-4" />
      {LANGUAGE_LABELS[otherLanguage] ?? otherLanguage}
    </Button>
  );
}
