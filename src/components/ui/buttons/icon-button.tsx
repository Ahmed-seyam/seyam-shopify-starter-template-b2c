import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

const iconButtonVariants = cva(
  "inline-flex shrink-0 cursor-pointer items-center justify-center rounded-full transition-colors outline-none select-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "text-foreground hover:bg-muted/70",
        surface:
          "bg-surface/90 text-foreground shadow-sm backdrop-blur-sm hover:bg-surface",
        outline:
          "border border-border bg-surface text-foreground hover:border-foreground/40",
        dark: "bg-foreground text-background hover:bg-foreground/90",
        accent: "bg-primary text-primary-foreground hover:bg-primary/90",
      },
      size: {
        sm: "size-8 [&_svg:not([class*='size-'])]:size-4",
        default: "size-10 [&_svg:not([class*='size-'])]:size-[1.125rem]",
        lg: "size-12 [&_svg:not([class*='size-'])]:size-5",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function IconButton({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof iconButtonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="icon-button"
      className={cn(iconButtonVariants({ variant, size }), className)}
      {...props}
    />
  );
}

export { IconButton, iconButtonVariants };
