"use client";

import * as React from "react";
import { MinusIcon, PlusIcon } from "lucide-react";
import { useTranslations } from "next-intl";

import { cn } from "@/utils";

const sizes = {
  sm: "h-8 [&_button]:w-7 [&_span]:min-w-7 text-xs",
  default: "h-11 [&_button]:w-10 [&_span]:min-w-9 text-sm",
} as const;

function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = 99,
  size = "default",
  disabled,
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  size?: keyof typeof sizes;
  disabled?: boolean;
  className?: string;
}) {
  const t = useTranslations("cart");

  return (
    <div
      data-slot="quantity-stepper"
      className={cn(
        "inline-flex items-stretch rounded-md border border-border bg-surface",
        sizes[size],
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <button
        type="button"
        aria-label={t("decrease")}
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex cursor-pointer items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <MinusIcon className="size-3.5" />
      </button>
      <span className="flex items-center justify-center font-medium text-foreground tabular-nums select-none">
        {value}
      </span>
      <button
        type="button"
        aria-label={t("increase")}
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex cursor-pointer items-center justify-center text-muted-foreground transition-colors outline-none hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/40 disabled:cursor-not-allowed disabled:opacity-40"
      >
        <PlusIcon className="size-3.5" />
      </button>
    </div>
  );
}

export { QuantityStepper };
