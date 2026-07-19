"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./sheet";

/**
 * Mobile bottom sheet (e.g. filters). A thin wrapper over Sheet pinned to the
 * bottom edge with a grab handle and rounded top corners.
 */
function BottomSheet(props: React.ComponentProps<typeof Sheet>) {
  return <Sheet {...props} />;
}

const BottomSheetTrigger = SheetTrigger;
const BottomSheetTitle = SheetTitle;
const BottomSheetDescription = SheetDescription;
const BottomSheetHeader = SheetHeader;

function BottomSheetContent({
  className,
  children,
  ...props
}: React.ComponentProps<typeof SheetContent>) {
  return (
    <SheetContent
      side="bottom"
      className={cn(
        "max-h-[85dvh] overflow-y-auto rounded-t-xl border-border",
        className
      )}
      {...props}
    >
      <div
        aria-hidden
        className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border"
      />
      {children}
    </SheetContent>
  );
}

export {
  BottomSheet,
  BottomSheetContent,
  BottomSheetDescription,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
};
