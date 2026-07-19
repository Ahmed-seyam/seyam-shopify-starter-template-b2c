"use client";

import { Trash2Icon } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton, ImageFrame, Price, QuantityStepper } from "@/core/ui";
import { Link } from "@/i18n/navigation";
import { cn } from "@/lib/utils";
import type { CartLine as CartLineData } from "../types";

/**
 * One cart line item, shared by the drawer (`drawer` density), the cart page
 * (`page`), and read-only summaries (order confirmation).
 */
export function CartLine({
  line,
  density = "page",
  readOnly = false,
  pending = false,
  onQuantityChange,
  onRemove,
  onNavigate,
  className,
}: {
  line: CartLineData;
  density?: "drawer" | "page";
  readOnly?: boolean;
  pending?: boolean;
  onQuantityChange?: (line: CartLineData, quantity: number) => void;
  onRemove?: (line: CartLineData) => void;
  onNavigate?: () => void;
  className?: string;
}) {
  const t = useTranslations("cart");
  const compact = density === "drawer";

  return (
    <div className={cn("flex gap-4", className)}>
      <ImageFrame
        src={line.merchandise.image?.url}
        alt={line.merchandise.image?.altText ?? line.merchandise.product.title}
        ratio="portrait"
        radius="md"
        sizes={compact ? "64px" : "96px"}
        className={cn("shrink-0", compact ? "w-16" : "w-24")}
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex items-start justify-between gap-3">
          <Link
            href={`/products/${line.merchandise.product.handle}`}
            onClick={onNavigate}
            className={cn(
              "font-medium text-foreground hover:underline",
              compact ? "text-sm" : "text-[0.9375rem]"
            )}
          >
            {line.merchandise.product.title}
          </Link>
          <Price
            money={line.cost.totalAmount}
            className={cn("shrink-0", compact ? "text-sm" : "text-[0.9375rem]")}
          />
        </div>

        {line.merchandise.title !== "Default Title" && (
          <span className="text-xs text-muted-foreground">
            {line.merchandise.title}
          </span>
        )}

        {readOnly ? (
          <span className="mt-auto text-xs text-muted-foreground">
            {t("quantity")}: {line.quantity}
          </span>
        ) : (
          <div className="mt-auto flex items-center justify-between pt-2">
            <QuantityStepper
              size="sm"
              value={line.quantity}
              disabled={pending}
              onChange={(quantity) => onQuantityChange?.(line, quantity)}
            />
            <IconButton
              size="sm"
              aria-label={t("remove")}
              disabled={pending}
              onClick={() => onRemove?.(line)}
              className="text-muted-foreground hover:text-destructive"
            >
              <Trash2Icon />
            </IconButton>
          </div>
        )}
      </div>
    </div>
  );
}
