import * as React from "react";

import { cn } from "@/lib/utils";

function Eyebrow({ className, ...props }: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="eyebrow"
      className={cn(
        "text-xs font-semibold tracking-[0.14em] text-muted-foreground uppercase",
        className
      )}
      {...props}
    />
  );
}

export { Eyebrow };
