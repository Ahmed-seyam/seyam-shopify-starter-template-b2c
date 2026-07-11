import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAuthConfig } from "@/core/shopify/customer-auth";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import { getCustomer, getOrders, OrderList } from "@/domains/customer";

// Customer data reads the session cookie — always rendered per request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("title") };
}

export default async function AccountPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  if (!customerAuthConfig()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("notConfigured")}</p>
      </div>
    );
  }

  const customer = await getCustomer();

  if (!customer) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("signInHint")}</p>
        <Button size="lg" asChild>
          <a href={`/api/auth/login?locale=${locale}`}>{t("signIn")}</a>
        </Button>
      </div>
    );
  }

  const orders = await getOrders();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground">
            {customer.displayName}
            {customer.email ? ` · ${customer.email}` : ""}
          </p>
        </div>
        <Button variant="outline" asChild>
          <a href={`/api/auth/logout?locale=${locale}`}>{t("signOut")}</a>
        </Button>
      </div>

      <Separator className="my-6" />

      <h2 className="mb-4 text-lg font-semibold">{t("ordersTitle")}</h2>
      <OrderList orders={orders} />
    </div>
  );
}
