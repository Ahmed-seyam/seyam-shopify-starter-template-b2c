import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Button, Container, Heading, NavLink } from "@/app/core/ui";
// Direct action import — the domain barrel must stay free of server-only code.
import { logout } from "../actions/logout";

const NAV_ITEMS = [
  { key: "overview", href: "/account", exact: true },
  { key: "addresses", href: "/account/addresses" },
  { key: "profile", href: "/account/profile" },
  { key: "payment", href: "/account/payment" },
  { key: "wishlist", href: "/account/wishlist" },
] as const;

/**
 * Two-column account chrome: side nav (horizontal scroller on mobile) with a
 * sign-out action, page content on the other side. Server component — pages
 * gate on auth before rendering it.
 */
export async function AccountShell({
  locale,
  title,
  children,
}: {
  locale: string;
  title: ReactNode;
  children: ReactNode;
}) {
  const t = await getTranslations({ locale, namespace: "account" });

  return (
    <Container className="py-10 lg:py-14">
      <Heading level={1} className="mb-8">
        {title}
      </Heading>
      <div className="flex flex-col gap-8 lg:flex-row lg:gap-14">
        <aside className="shrink-0 lg:w-48">
          <nav
            aria-label={t("title")}
            className="-mx-4 flex items-center gap-6 overflow-x-auto px-4 pb-1 lg:mx-0 lg:flex-col lg:items-stretch lg:gap-4 lg:overflow-visible lg:px-0"
          >
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.key}
                href={item.href}
                exact={"exact" in item && item.exact}
                className="shrink-0 py-1 lg:after:hidden"
              >
                {t(`nav.${item.key}`)}
              </NavLink>
            ))}
            {/* Sign-out is a state change → POST via Server Action, not a GET link. */}
            <form action={logout} className="shrink-0 lg:mt-2">
              <input type="hidden" name="locale" value={locale} />
              <Button type="submit" variant="outline" size="sm">
                {t("signOut")}
              </Button>
            </form>
          </nav>
        </aside>
        <div className="min-w-0 flex-1">{children}</div>
      </div>
    </Container>
  );
}
