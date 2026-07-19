"use client";

import * as React from "react";
import { StarIcon } from "lucide-react";

import { cn } from "@/lib/utils";

const sizeClasses = {
  sm: "[&_svg]:size-3.5",
  default: "[&_svg]:size-4",
  lg: "[&_svg]:size-6",
} as const;

/**
 * Star rating. Display mode by default; pass `onChange` for input mode
 * (review forms) — stars become buttons.
 */
function RatingStars({
  value,
  max = 5,
  onChange,
  size = "default",
  className,
  label,
}: {
  value: number;
  max?: number;
  onChange?: (next: number) => void;
  size?: keyof typeof sizeClasses;
  className?: string;
  label?: string;
}) {
  const [hover, setHover] = React.useState<number | null>(null);
  const shown = onChange && hover !== null ? hover : value;

  const stars = Array.from({ length: max }, (_, i) => {
    const filled = shown >= i + 1;
    const half = !filled && shown > i && shown < i + 1;
    return (
      <span key={i} className="relative inline-flex">
        <StarIcon
          aria-hidden
          className={cn(
            "text-border",
            filled && "fill-rating text-rating"
          )}
        />
        {half && (
          <span className="absolute inset-0 w-1/2 overflow-hidden rtl:left-auto rtl:right-0">
            <StarIcon aria-hidden className="fill-rating text-rating" />
          </span>
        )}
      </span>
    );
  });

  if (!onChange) {
    return (
      <span
        data-slot="rating-stars"
        role="img"
        aria-label={label ?? `${value} / ${max}`}
        className={cn("inline-flex items-center gap-0.5", sizeClasses[size], className)}
      >
        {stars}
      </span>
    );
  }

  return (
    <div
      data-slot="rating-stars"
      role="radiogroup"
      aria-label={label}
      className={cn("inline-flex items-center gap-1", sizeClasses[size], className)}
      onMouseLeave={() => setHover(null)}
    >
      {Array.from({ length: max }, (_, i) => (
        <button
          key={i}
          type="button"
          role="radio"
          aria-checked={value === i + 1}
          aria-label={`${i + 1} / ${max}`}
          className="cursor-pointer rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
          onMouseEnter={() => setHover(i + 1)}
          onFocus={() => setHover(i + 1)}
          onBlur={() => setHover(null)}
          onClick={() => onChange(i + 1)}
        >
          <StarIcon
            aria-hidden
            className={cn(
              "text-border transition-colors",
              shown >= i + 1 && "fill-rating text-rating"
            )}
          />
        </button>
      ))}
    </div>
  );
}

export { RatingStars };
