import * as React from "react";
import { SearchIcon } from "lucide-react";

import { cn } from "@/utils";
import { Input } from "./input";

function SearchInput({
  className,
  containerClassName,
  ...props
}: React.ComponentProps<typeof Input> & { containerClassName?: string }) {
  return (
    <div
      data-slot="search-input"
      className={cn("relative w-full", containerClassName)}
    >
      <SearchIcon
        aria-hidden
        className="pointer-events-none absolute start-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
      />
      <Input
        type="search"
        className={cn(
          "ps-10 [&::-webkit-search-cancel-button]:hidden",
          className
        )}
        {...props}
      />
    </div>
  );
}

export { SearchInput };
