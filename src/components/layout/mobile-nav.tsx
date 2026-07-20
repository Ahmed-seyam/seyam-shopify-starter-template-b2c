"use client";

import { MenuIcon, UserIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { Suspense, useState } from "react";
import { navItems } from "@/config/nav";
import {
  IconButton,
  Separator,
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { CountrySwitcher } from "./country-switcher";
import { LocaleSwitcher } from "./locale-switcher";

export function MobileNav() {
  const t = useTranslations("layout");
  const tNav = useTranslations("nav");
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <IconButton aria-label={t("menu")}>
          <MenuIcon />
        </IconButton>
      </SheetTrigger>
      <SheetContent side="start" className="gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-serif text-xl font-semibold tracking-wide uppercase">
            {t("storeName")}
          </SheetTitle>
        </SheetHeader>

        <nav aria-label="Main" className="flex flex-col overflow-y-auto p-2">
          {navItems.map((item) => (
            <Link
              key={item.labelKey}
              href={item.href}
              onClick={() => setOpen(false)}
              className="rounded-md px-3 py-3 text-base font-medium text-foreground transition-colors hover:bg-muted/60"
            >
              {tNav(item.labelKey)}
            </Link>
          ))}
        </nav>

        <Separator />

        <div className="flex flex-col gap-3 p-4">
          <Link
            href="/account"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-2 text-sm font-medium text-foreground"
          >
            <UserIcon className="size-4" />
            {t("account")}
          </Link>
          <div className="flex items-center gap-2">
            <Suspense>
              <CountrySwitcher />
            </Suspense>
            <Suspense>
              <LocaleSwitcher />
            </Suspense>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
