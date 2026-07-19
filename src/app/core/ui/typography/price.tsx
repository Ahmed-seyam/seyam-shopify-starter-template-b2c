import { useLocale } from "next-intl";
import type { Money } from "@/app/core/shopify/types";
import { cn } from "@/lib/utils";

export function formatMoney(money: Money, locale: string): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: money.currencyCode,
  }).format(Number(money.amount));
}

export function Price({
  money,
  compareAt,
  className,
}: {
  money: Money;
  compareAt?: Money | null;
  className?: string;
}) {
  const locale = useLocale();
  const onSale = compareAt && Number(compareAt.amount) > Number(money.amount);

  return (
    <span
      data-slot="price"
      className={cn("inline-flex items-baseline gap-2", className)}
    >
      <span className={cn(onSale && "font-semibold text-sale")}>
        {formatMoney(money, locale)}
      </span>
      {onSale && (
        <s className="text-sm text-muted-foreground">
          {formatMoney(compareAt, locale)}
        </s>
      )}
    </span>
  );
}
