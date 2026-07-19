import * as React from "react";
import { ArrowRightIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Heading } from "@/core/ui/typography";
import { Link } from "@/i18n/navigation";

function SectionHeader({
  title,
  eyebrow,
  action,
  actionHref,
  className,
}: {
  title: React.ReactNode;
  eyebrow?: React.ReactNode;
  /** Trailing action label (e.g. "View All"); rendered as a link when `actionHref` is set. */
  action?: React.ReactNode;
  actionHref?: string;
  className?: string;
}) {
  return (
    <div
      data-slot="section-header"
      className={cn("mb-8 flex items-end justify-between gap-4", className)}
    >
      <div className="grid gap-1.5">
        {eyebrow && (
          <p className="text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase">
            {eyebrow}
          </p>
        )}
        <Heading level={2}>{title}</Heading>
      </div>
      {action && actionHref && (
        <Link
          href={actionHref}
          className="group inline-flex shrink-0 items-center gap-1.5 text-sm font-medium text-foreground underline-offset-4 hover:underline"
        >
          {action}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}

export { SectionHeader };
