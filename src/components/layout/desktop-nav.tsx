"use client";

import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRef, useState } from "react";
import { navItems } from "@/lib/config/nav";
import { ImageFrame, NavLink } from "@/components/ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";

/**
 * Desktop nav row + mega menu panel. The panel is positioned against the
 * sticky <header>; opens on hover or focus, closes on Escape / mouse-out.
 */
export function DesktopNav() {
  const t = useTranslations("nav");
  const [open, setOpen] = useState<number | null>(null);
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(null), 120);
  };
  const cancelClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current);
  };

  const openItem = open !== null ? navItems[open] : null;

  return (
    <nav
      aria-label="Main"
      className="hidden flex-1 lg:block"
      onKeyDown={(event) => {
        if (event.key === "Escape") setOpen(null);
      }}
    >
      <ul className="flex items-center gap-6">
        {navItems.map((item, i) => (
          <li
            key={item.labelKey}
            onMouseEnter={() => {
              cancelClose();
              setOpen(item.columns ? i : null);
            }}
            onMouseLeave={scheduleClose}
          >
            <NavLink
              href={item.href}
              aria-haspopup={item.columns ? "menu" : undefined}
              aria-expanded={item.columns ? open === i : undefined}
              onFocus={() => setOpen(item.columns ? i : null)}
              className={cn(open === i && "text-foreground after:scale-x-100")}
            >
              {t(item.labelKey)}
            </NavLink>
          </li>
        ))}
      </ul>

      {openItem?.columns && (
        <div
          role="menu"
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          className="absolute inset-x-0 top-full border-b border-border bg-surface shadow-[0_16px_32px_rgb(0_0_0/0.06)]"
        >
          <div className="mx-auto grid max-w-[1360px] grid-cols-[repeat(4,1fr)_1.3fr] gap-6 px-8 py-7">
            {openItem.columns.map((column) => (
              <div key={column.titleKey} className="flex flex-col gap-2.5">
                <p className="text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  {t(column.titleKey)}
                </p>
                {column.links.map((link) => (
                  <Link
                    key={link.labelKey}
                    href={link.href}
                    onClick={() => setOpen(null)}
                    className="text-sm text-body transition-colors hover:text-foreground"
                  >
                    {t(link.labelKey)}
                  </Link>
                ))}
              </div>
            ))}
            {openItem.promo && (
              <Link
                href={openItem.promo.href}
                onClick={() => setOpen(null)}
                className="group flex flex-col gap-2.5"
              >
                <p className="text-xs font-semibold tracking-[0.05em] text-muted-foreground uppercase">
                  {t("columns.featured")}
                </p>
                <ImageFrame
                  src={openItem.promo.image}
                  alt={t(openItem.promo.labelKey)}
                  ratio="wide"
                  radius="lg"
                  sizes="340px"
                />
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                  {t(openItem.promo.labelKey)}
                  <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
                </span>
              </Link>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
