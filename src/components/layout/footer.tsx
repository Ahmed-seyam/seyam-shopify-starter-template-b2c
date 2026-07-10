import { useTranslations } from "next-intl";

export function Footer() {
  const t = useTranslations("layout");

  return (
    <footer className="border-t py-8">
      <div className="mx-auto max-w-7xl px-4 text-sm text-muted-foreground">
        <p>
          {t("storeName")} — {t("footerNote")}
        </p>
      </div>
    </footer>
  );
}
