import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import {
  AlertCircleIcon,
  CheckCircle2Icon,
  InfoIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";

const alertVariants = cva(
  "relative flex w-full items-start gap-3 rounded-md border px-4 py-3 text-sm [&_svg]:mt-0.5 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        info: "border-border bg-muted/60 text-body [&_svg]:text-muted-foreground",
        success:
          "border-accent-light/60 bg-accent-light/15 text-foreground [&_svg]:text-primary",
        error:
          "border-destructive/30 bg-destructive/8 text-destructive [&_svg]:text-destructive",
      },
    },
    defaultVariants: {
      variant: "info",
    },
  }
);

const icons = {
  info: InfoIcon,
  success: CheckCircle2Icon,
  error: AlertCircleIcon,
} as const;

function Alert({
  className,
  variant = "info",
  title,
  children,
  ...props
}: React.ComponentProps<"div"> &
  VariantProps<typeof alertVariants> & { title?: React.ReactNode }) {
  const Icon = icons[variant ?? "info"];

  return (
    <div
      data-slot="alert"
      role={variant === "error" ? "alert" : "status"}
      className={cn(alertVariants({ variant }), className)}
      {...props}
    >
      <Icon aria-hidden />
      <div className="grid gap-0.5">
        {title && <p className="font-medium">{title}</p>}
        {children && <div className="[&_a]:font-medium [&_a]:underline">{children}</div>}
      </div>
    </div>
  );
}

export { Alert, alertVariants };
