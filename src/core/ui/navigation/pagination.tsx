import * as React from "react";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Link } from "@/i18n/navigation";

type PageLink = { page: number; href: string };

/**
 * Numbered pagination built from precomputed hrefs (server-friendly —
 * callers derive hrefs from search params).
 */
function Pagination({
  current,
  pages,
  prevHref,
  nextHref,
  className,
}: {
  current: number;
  pages: PageLink[];
  prevHref?: string;
  nextHref?: string;
  className?: string;
}) {
  if (pages.length <= 1) return null;

  const itemClass =
    "inline-flex size-10 items-center justify-center rounded-md border text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40";

  return (
    <nav
      data-slot="pagination"
      aria-label="Pagination"
      className={cn("flex items-center justify-center gap-2", className)}
    >
      {prevHref ? (
        <Link href={prevHref} aria-label="Previous page" className={cn(itemClass, "border-border text-foreground hover:bg-muted/60")}>
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, "border-border text-muted-foreground/40")}>
          <ChevronLeftIcon className="size-4 rtl:rotate-180" />
        </span>
      )}
      {pages.map(({ page, href }) =>
        page === current ? (
          <span
            key={page}
            aria-current="page"
            className={cn(itemClass, "border-foreground bg-foreground text-background")}
          >
            {page}
          </span>
        ) : (
          <Link
            key={page}
            href={href}
            className={cn(itemClass, "border-border text-foreground hover:bg-muted/60")}
          >
            {page}
          </Link>
        )
      )}
      {nextHref ? (
        <Link href={nextHref} aria-label="Next page" className={cn(itemClass, "border-border text-foreground hover:bg-muted/60")}>
          <ChevronRightIcon className="size-4 rtl:rotate-180" />
        </Link>
      ) : (
        <span aria-hidden className={cn(itemClass, "border-border text-muted-foreground/40")}>
          <ChevronRightIcon className="size-4 rtl:rotate-180" />
        </span>
      )}
    </nav>
  );
}

export { Pagination };
