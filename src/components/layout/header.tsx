import { UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/core/ui/button";
import { Link } from "@/i18n/navigation";
import { CartBadge } from "./cart-badge";
import { CountrySwitcher } from "./country-switcher";
import { LocaleSwitcher } from "./locale-switcher";
import { SearchForm } from "./search-form";
import { ThemeToggle } from "./theme-toggle";

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
          <CountrySwitcher />
          <LocaleSwitcher />
          <ThemeToggle />
          <Button variant="ghost" size="sm" asChild>
            {/* Static-safe: session is only read on the account page itself. */}
            <Link href="/account" aria-label={t("account")}>
              <UserIcon className="size-5" />
            </Link>
          </Button>
          <CartBadge label={t("cart")} />
        </div>
      </div>
    </header>
  );
}
