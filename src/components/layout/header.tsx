import { UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense } from "react";
import { env } from "@/core/config/env";
import { IconButton } from "@/core/ui";
import { CartDrawer } from "@/domains/cart/components/cart-drawer";
import { WishlistPopup } from "@/domains/wishlist";
import { Link } from "@/i18n/navigation";
import { AnnouncementBar } from "./announcement-bar";
import { CountrySwitcher } from "./country-switcher";
import { DesktopNav } from "./desktop-nav";
import { LocaleSwitcher } from "./locale-switcher";
import { MobileNav } from "./mobile-nav";
import { SearchPopup } from "./search-popup";
import { ThemeToggle } from "./theme-toggle";

export function Header() {
  const t = useTranslations("layout");

  return (
    <>
      <AnnouncementBar />
      <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/85">
        <div className="relative mx-auto flex h-16 max-w-[1360px] items-center gap-7 px-4 md:px-8">
          <div className="flex items-center gap-2 lg:hidden">
            <MobileNav />
          </div>

          <Link
            href="/"
            className="shrink-0 font-serif text-2xl font-semibold tracking-wide text-foreground uppercase"
          >
            {t("storeName")}
          </Link>

          <DesktopNav />

          <div className="ms-auto flex items-center gap-1">
            <SearchPopup />
            <div className="hidden items-center gap-1 md:flex">
              <Suspense>
                <CountrySwitcher />
              </Suspense>
              <Suspense>
                <LocaleSwitcher />
              </Suspense>
            </div>
            <ThemeToggle />
            <WishlistPopup />
            <IconButton asChild>
              {/* Static-safe: session is only read on the account page itself. */}
              <Link href="/account" aria-label={t("account")}>
                <UserIcon />
              </Link>
            </IconButton>
            <CartDrawer checkoutMode={env().CHECKOUT_MODE} />
          </div>
        </div>
      </header>
    </>
  );
}
