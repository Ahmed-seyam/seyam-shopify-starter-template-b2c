import * as React from "react";

import { cn } from "@/lib/utils";
import { Heading } from "@/components/ui/typography";

function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  ...props
}: React.ComponentProps<"div"> & {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border px-6 py-16 text-center",
        className
      )}
      {...props}
    >
      {icon && (
        <div className="flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&_svg]:size-5">
          {icon}
        </div>
      )}
      <Heading level={3} asChild>
        <p>{title}</p>
      </Heading>
      {description && (
        <p className="max-w-sm text-sm text-muted-foreground">{description}</p>
      )}
      {action && <div className="mt-3">{action}</div>}
    </div>
  );
}

export { EmptyState };
