import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/plugins/server/shopify/customer-session";
import {
  Card,
  CardContent,
  formatMoney,
  Heading,
  ImageFrame,
  Separator,
  Text,
} from "@/components/ui";
import { getOrder } from "@/app/[locale]/account/_actions/get-order";
import { AccountShell } from "@/app/[locale]/account/_components/account-shell";
import { OrderStatusBadge } from "@/app/[locale]/account/_components/order-status-badge";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const t = await getTranslations("account");
  return { title: t("orderTitle", { number: id }) };
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  setRequestLocale(locale);

  if (!customerAccountsEnabled()) notFound();

  const order = await getOrder(id, locale);
  if (!order) redirect(`/${locale}/account`);

  const t = await getTranslations("account");
  const date = new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(order.processedAt)
  );

  return (
    <AccountShell locale={locale} title={t("orderTitle", { number: order.name })}>
      <Link
        href="/account"
        className="mb-6 inline-block text-sm text-muted-foreground underline-offset-4 hover:underline"
      >
        {t("backToAccount")}
      </Link>

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Text variant="muted">{t("placedOn", { date })}</Text>
        {order.financialStatus && (
          <OrderStatusBadge status={order.financialStatus} />
        )}
        {order.fulfillmentStatus && (
          <OrderStatusBadge status={order.fulfillmentStatus} />
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-[1fr_20rem] lg:items-start">
        <ul className="divide-y divide-border rounded-lg border border-border bg-surface">
          {order.lineItems.map((line, index) => (
            <li key={index} className="flex items-center gap-4 p-4">
              <ImageFrame
                src={line.image?.url}
                alt={line.image?.altText ?? line.title}
                ratio="square"
                radius="md"
                sizes="64px"
                className="w-16 shrink-0"
              />
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate font-medium text-foreground">
                  {line.title}
                </span>
                {line.variantTitle && line.variantTitle !== "Default Title" && (
                  <span className="text-sm text-muted-foreground">
                    {line.variantTitle}
                  </span>
                )}
                <span className="text-sm text-muted-foreground">
                  {t("quantityLabel", { count: line.quantity })}
                </span>
              </div>
              <span className="font-medium text-foreground tabular-nums">
                {formatMoney(line.totalPrice, locale)}
              </span>
            </li>
          ))}
        </ul>

        <div className="flex flex-col gap-6">
          <Card>
            <CardContent className="flex flex-col gap-2 text-sm">
              {order.subtotalPrice && (
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">{t("subtotal")}</span>
                  <span className="tabular-nums">
                    {formatMoney(order.subtotalPrice, locale)}
                  </span>
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">{t("shipping")}</span>
                <span className="tabular-nums">
                  {formatMoney(order.totalShippingPrice, locale)}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex items-center justify-between font-medium text-foreground">
                <span>{t("total")}</span>
                <span className="tabular-nums">
                  {formatMoney(order.totalPrice, locale)}
                </span>
              </div>
            </CardContent>
          </Card>

          {order.shippingAddress && order.shippingAddress.length > 0 && (
            <Card>
              <CardContent>
                <Heading level={4} className="mb-3">
                  {t("shippingAddress")}
                </Heading>
                <address className="text-sm text-body not-italic">
                  {order.shippingAddress.map((line) => (
                    <div key={line}>{line}</div>
                  ))}
                </address>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AccountShell>
  );
}
