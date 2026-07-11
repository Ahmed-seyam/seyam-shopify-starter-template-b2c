import { useLocale, useTranslations } from "next-intl";
import { formatMoney } from "@/domains/product/components/price";
import type { CustomerOrder } from "../types";

export function OrderList({ orders }: { orders: CustomerOrder[] }) {
  const t = useTranslations("account");
  const locale = useLocale();

  if (orders.length === 0) {
    return <p className="text-muted-foreground">{t("noOrders")}</p>;
  }

  return (
    <ul className="divide-y rounded-md border">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex items-center justify-between gap-4 p-4"
        >
          <div className="flex flex-col">
            <span className="font-medium">{order.name}</span>
            <span className="text-sm text-muted-foreground">
              {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                new Date(order.processedAt),
              )}
            </span>
          </div>
          <div className="flex flex-col items-end">
            <span className="font-medium tabular-nums">
              {formatMoney(order.totalPrice, locale)}
            </span>
            {order.financialStatus && (
              <span className="text-xs uppercase text-muted-foreground">
                {order.financialStatus.toLowerCase().replace(/_/g, " ")}
              </span>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
