import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

const textVariants = cva("", {
  variants: {
    variant: {
      body: "text-[0.9375rem] leading-relaxed text-body",
      muted: "text-sm leading-relaxed text-muted-foreground",
      small: "text-xs leading-normal text-muted-foreground",
    },
  },
  defaultVariants: {
    variant: "body",
  },
});

type TextProps = React.ComponentProps<"p"> &
  VariantProps<typeof textVariants> & {
    asChild?: boolean;
  };

function Text({ className, variant, asChild = false, ...props }: TextProps) {
  const Comp = asChild ? Slot.Root : "p";

  return (
    <Comp
      data-slot="text"
      className={cn(textVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Text, textVariants };
