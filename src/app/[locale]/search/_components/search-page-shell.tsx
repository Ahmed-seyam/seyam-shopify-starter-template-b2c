import type { ReactNode } from "react";
import { Container } from "@/components/ui";

/**
 * Layout shared by the two search modes (Shopify SSR page and Algolia
 * InstantSearch) so their pages cannot drift apart: search box on top, then
 * whatever the mode renders below. Slot-based — each mode brings its own
 * connected controls.
 */
export function SearchPageShell({
  searchBox,
  children,
}: {
  searchBox: ReactNode;
  children: ReactNode;
}) {
  return (
    <Container className="py-8">
      <div className="mx-auto mb-8 w-full max-w-xl">{searchBox}</div>
      {children}
    </Container>
  );
}

/** Filter sidebar + results column, with a toolbar row and optional chips. */
export function SearchResultsLayout({
  sidebar,
  toolbar,
  chips,
  pagination,
  children,
}: {
  sidebar: ReactNode;
  toolbar: ReactNode;
  chips?: ReactNode;
  pagination?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className="flex items-start gap-10">
      {sidebar}

      <div className="flex min-w-0 flex-1 flex-col gap-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          {toolbar}
        </div>

        {chips}
        {children}
        {pagination}
      </div>
    </div>
  );
}
