import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/lib/utils";

const headingVariants = cva("font-serif font-medium text-foreground", {
  variants: {
    level: {
      1: "text-4xl leading-[1.1] tracking-tight text-balance md:text-[3.25rem]",
      2: "text-[1.75rem] leading-tight tracking-tight md:text-[2rem]",
      3: "text-[1.375rem] leading-snug md:text-[1.625rem]",
      4: "text-lg leading-snug md:text-[1.375rem]",
    },
  },
  defaultVariants: {
    level: 2,
  },
});

type HeadingProps = React.ComponentProps<"h2"> &
  VariantProps<typeof headingVariants> & {
    /** Render as a different element than `h{level}` (e.g. visual h1 as an h2). */
    asChild?: boolean;
  };

function Heading({ className, level = 2, asChild = false, ...props }: HeadingProps) {
  const Comp = asChild ? Slot.Root : (`h${level ?? 2}` as "h2");

  return (
    <Comp
      data-slot="heading"
      className={cn(headingVariants({ level }), className)}
      {...props}
    />
  );
}

export { Heading, headingVariants };
