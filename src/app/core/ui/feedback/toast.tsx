"use client";

import { Toaster as SonnerToaster, toast } from "sonner";

/**
 * App-wide toast outlet, styled to the Fielding tokens. Mount once in the
 * root layout; fire with `toast(...)` / `toast.success(...)` etc.
 */
function Toaster(props: React.ComponentProps<typeof SonnerToaster>) {
  return (
    <SonnerToaster
      position="bottom-right"
      toastOptions={{
        classNames: {
          toast:
            "!rounded-lg !border-border !bg-popover !text-popover-foreground !shadow-lg !text-sm",
          title: "!font-medium",
          description: "!text-muted-foreground",
          actionButton: "!bg-primary !text-primary-foreground !rounded-md",
          cancelButton: "!bg-muted !text-foreground !rounded-md",
        },
      }}
      {...props}
    />
  );
}

export { Toaster, toast };
