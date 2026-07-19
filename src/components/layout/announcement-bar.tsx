import { useTranslations } from "next-intl";

export function AnnouncementBar() {
  const t = useTranslations("layout");

  return (
    <div className="bg-foreground py-2 text-center text-xs font-medium tracking-[0.08em] text-background uppercase">
      {t("announcement")}
    </div>
  );
}
