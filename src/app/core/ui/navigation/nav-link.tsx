"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Link, usePathname } from "@/i18n/navigation";

/**
 * Nav link with the spec's active-underline state. Active when the current
 * pathname equals `href` (or starts with it for section links).
 */
function NavLink({
  href,
  exact = false,
  className,
  children,
  ...props
}: React.ComponentProps<typeof Link> & { exact?: boolean }) {
  const pathname = usePathname();
  const hrefStr = typeof href === "string" ? href : (href.pathname ?? "");
  const active = exact
    ? pathname === hrefStr
    : hrefStr !== "/" && pathname.startsWith(hrefStr);

  return (
    <Link
      href={href}
      data-slot="nav-link"
      aria-current={active ? "page" : undefined}
      className={cn(
        "relative text-sm font-medium text-body transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40",
        "after:absolute after:inset-x-0 after:-bottom-1 after:h-px after:origin-center after:scale-x-0 after:bg-foreground after:transition-transform",
        active && "text-foreground after:scale-x-100",
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}

export { NavLink };
