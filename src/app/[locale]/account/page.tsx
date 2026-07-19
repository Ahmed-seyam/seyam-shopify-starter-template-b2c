import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/app/core/shopify/customer-session";
import { Button, Container, Heading, Text } from "@/app/core/ui";
import { AccountShell } from "@/app/[locale]/account/components/account-shell";
import { getCustomer, getOrders, OrderList } from "@/app/[locale]/account";
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
      <Container className="max-w-2xl py-24 text-center">
        <Heading level={1} className="mb-3">
          {t("title")}
        </Heading>
        <Text variant="muted">{t("notConfigured")}</Text>
      </Container>
    );
  }

  const customer = await getCustomer(locale);

  if (!customer) {
    return (
      <Container className="flex max-w-2xl flex-col items-center gap-4 py-24 text-center">
        <Heading level={1}>{t("title")}</Heading>
        <Text variant="muted">{t("signInHint")}</Text>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" asChild>
            <Link href="/account/login">{t("signIn")}</Link>
          </Button>
          <Button size="lg" variant="outline" asChild>
            <Link href="/account/register">{t("registerCta")}</Link>
          </Button>
        </div>
      </Container>
    );
  }

  const orders = await getOrders({ locale });

  return (
    <AccountShell
      locale={locale}
      title={t("welcome", {
        name: customer.firstName ?? customer.displayName,
      })}
    >
      {customer.email && (
        <Text variant="muted" className="mb-8">
          {customer.email}
        </Text>
      )}
      <Heading level={3} className="mb-4">
        {t("ordersTitle")}
      </Heading>
      <OrderList orders={orders} />
    </AccountShell>
  );
}
