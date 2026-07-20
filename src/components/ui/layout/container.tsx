import * as React from "react";
import { Slot } from "radix-ui";

import { cn } from "@/utils";

function Container({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"div"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "div";

  return (
    <Comp
      data-slot="container"
      className={cn("mx-auto w-full max-w-[1360px] px-4 md:px-8", className)}
      {...props}
    />
  );
}

export { Container };
