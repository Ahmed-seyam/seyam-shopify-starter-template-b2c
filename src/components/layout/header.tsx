import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { CartBadge } from "./cart-badge";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchForm } from "./search-form";

export function Header() {
  const t = useTranslations("layout");

  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center gap-4 px-4">
        <Link href="/" className="shrink-0 text-lg font-bold tracking-tight">
          {t("storeName")}
        </Link>
        <div className="hidden flex-1 justify-center px-4 sm:flex">
          <SearchForm placeholder={t("searchPlaceholder")} />
        </div>
        <div className="ms-auto flex items-center gap-2 sm:ms-0">
          <LocaleSwitcher />
          <CartBadge label={t("cart")} />
        </div>
      </div>
    </header>
  );
}
