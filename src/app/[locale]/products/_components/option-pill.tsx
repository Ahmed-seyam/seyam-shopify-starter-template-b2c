"use client";

import * as React from "react";

import { cn } from "@/utils";

/**
 * Variant option pill shared by the PDP variant selector, quick-add dialog,
 * and the gift-card amount picker. States per spec #s-variants:
 * default / selected / disabled (unavailable = struck).
 */
export function OptionPill({
  selected,
  unavailable,
  className,
  children,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  unavailable?: boolean;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={cn(
        "inline-flex h-10 min-w-11 cursor-pointer items-center justify-center rounded-md border px-3.5 text-sm font-medium transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected
          ? "border-foreground bg-foreground text-background"
          : "border-border bg-surface text-foreground hover:border-foreground/40",
        unavailable &&
          "cursor-not-allowed border-dashed text-muted-foreground/60 line-through hover:border-border",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

/** Color swatch variant — ring when selected. */
export function SwatchPill({
  selected,
  unavailable,
  color,
  label,
  className,
  ...props
}: React.ComponentProps<"button"> & {
  selected?: boolean;
  unavailable?: boolean;
  color: string;
  label: string;
}) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      aria-label={label}
      title={label}
      className={cn(
        "relative size-8 cursor-pointer rounded-full border border-border transition-shadow outline-none focus-visible:ring-2 focus-visible:ring-ring/40",
        selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
        unavailable && "cursor-not-allowed opacity-40",
        className
      )}
      style={{ backgroundColor: color }}
      {...props}
    >
      {unavailable && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full bg-[linear-gradient(to_top_right,transparent_calc(50%-1px),var(--color-border),transparent_calc(50%+1px))]"
        />
      )}
    </button>
  );
}
