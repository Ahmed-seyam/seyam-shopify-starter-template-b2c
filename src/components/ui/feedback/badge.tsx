import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

const badgeVariants = cva(
  "inline-flex w-fit shrink-0 items-center justify-center gap-1 rounded-full px-2.5 py-0.5 text-[0.6875rem] font-semibold tracking-[0.08em] uppercase whitespace-nowrap select-none [&_svg]:pointer-events-none [&_svg]:size-3",
  {
    variants: {
      variant: {
        default: "bg-secondary text-secondary-foreground",
        dark: "bg-foreground text-background",
        sale: "bg-sale text-white",
        accent: "bg-primary text-primary-foreground",
        outline: "border border-border bg-surface text-foreground",
        count:
          "min-w-4 rounded-full bg-primary px-1 py-0 text-[0.625rem] tracking-normal text-primary-foreground tabular-nums normal-case",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> &
  VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
