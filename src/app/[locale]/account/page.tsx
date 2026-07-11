import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/core/shopify/customer-session";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
import { logout } from "@/domains/customer/actions/logout";
import { getCustomer, getOrders, OrderList } from "@/domains/customer";
import { Link } from "@/i18n/navigation";

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

  if (!customerAccountsEnabled()) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-24 text-center">
        <h1 className="mb-3 text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("notConfigured")}</p>
      </div>
    );
  }

  const customer = await getCustomer(locale);

  if (!customer) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("signInHint")}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/account/login">{t("signIn")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/account/register">{t("registerCta")}</Link>
          </Button>
        </div>
      </div>
    );
  }

  const orders = await getOrders({ locale });

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
        {/* Sign-out is a state change → POST via Server Action, not a GET link. */}
        <form action={logout}>
          <input type="hidden" name="locale" value={locale} />
          <Button type="submit" variant="outline">
            {t("signOut")}
          </Button>
        </form>
      </div>

      <Separator className="my-6" />

      <h2 className="mb-4 text-lg font-semibold">{t("ordersTitle")}</h2>
      <OrderList orders={orders} />
    </div>
  );
}
