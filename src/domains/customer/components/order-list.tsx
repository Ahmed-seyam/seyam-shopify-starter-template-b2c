import { useLocale, useTranslations } from "next-intl";
import { ChevronRightIcon } from "lucide-react";
import { EmptyState, formatMoney } from "@/core/ui";
import { Link } from "@/i18n/navigation";
import type { CustomerOrder } from "../types";
import { OrderStatusBadge } from "./order-status-badge";

export function OrderList({ orders }: { orders: CustomerOrder[] }) {
  const t = useTranslations("account");
  const locale = useLocale();

  if (orders.length === 0) {
    return <EmptyState title={t("noOrders")} />;
  }

  return (
    <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
      {orders.map((order) => (
        <li key={order.id}>
          <Link
            href={`/account/orders/${order.orderNumber}`}
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none sm:px-5"
          >
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="font-medium text-foreground">{order.name}</span>
              <span className="text-sm text-muted-foreground">
                {new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(
                  new Date(order.processedAt)
                )}
              </span>
            </div>
            {order.financialStatus && (
              <OrderStatusBadge status={order.financialStatus} />
            )}
            <span className="font-medium text-foreground tabular-nums">
              {formatMoney(order.totalPrice, locale)}
            </span>
            <ChevronRightIcon
              aria-hidden
              className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
