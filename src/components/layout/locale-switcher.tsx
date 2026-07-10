"use client";

import { GlobeIcon } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { Button } from "@/core/ui/button";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<string, string> = {
  en: "English",
  ar: "العربية",
};

/** Toggles to the other locale, preserving the current path and query. */
export function LocaleSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const other = routing.locales.find((candidate) => candidate !== locale);
  if (!other) return null;

  return (
    <Button
      variant="ghost"
      size="sm"
      aria-label={`Switch language to ${LOCALE_LABELS[other] ?? other}`}
      onClick={() => {
        const query = searchParams.toString();
        router.replace(query ? `${pathname}?${query}` : pathname, {
          locale: other,
        });
      }}
    >
      <GlobeIcon className="size-4" />
      {LOCALE_LABELS[other] ?? other}
    </Button>
  );
}
