import { useLocale, useTranslations } from "next-intl";
import { Button, Container, Heading, SearchInput, Text } from "@/app/core/ui";
import { navItems } from "@/app/core/config/nav";
import { Link } from "@/i18n/navigation";

export default function NotFound() {
  const t = useTranslations("errors");
  const tNav = useTranslations("nav");
  const locale = useLocale();

  return (
    <Container className="flex max-w-xl flex-col items-center gap-6 py-24 text-center">
      <Heading level={1}>{t("notFoundTitle")}</Heading>
      <Text variant="muted">{t("notFoundBody")}</Text>

      {/* Plain GET form — works without client JS on an error page. */}
      <form action={`/${locale}/search`} className="w-full max-w-sm">
        <SearchInput name="q" placeholder={t("notFoundSearch")} />
      </form>

      <div className="flex flex-wrap items-center justify-center gap-2">
        {navItems.slice(0, 5).map((item) => (
          <Button key={item.href} variant="outline" size="sm" asChild>
            <Link href={item.href}>{tNav(item.labelKey)}</Link>
          </Button>
        ))}
      </div>

      <Button asChild>
        <Link href="/">{t("backHome")}</Link>
      </Button>
    </Container>
  );
}
