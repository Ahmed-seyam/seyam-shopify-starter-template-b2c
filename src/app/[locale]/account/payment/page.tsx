import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { CreditCardIcon } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/app/core/shopify/customer-session";
import { EmptyState } from "@/app/core/ui";
import { getCustomer } from "@/app/[locale]/account";
import { AccountShell } from "@/app/[locale]/account/_components/account-shell";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("nav.payment") };
}

export default async function PaymentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!customerAccountsEnabled()) redirect(`/${locale}/account`);
  const customer = await getCustomer(locale);
  if (!customer) redirect(`/${locale}/account`);

  const t = await getTranslations("account");

  return (
    <AccountShell locale={locale} title={t("nav.payment")}>
      {/* The Storefront API exposes no saved payment methods — cards are
          entered and vaulted by Shopify at checkout. */}
      <EmptyState
        icon={<CreditCardIcon />}
        title={t("paymentTitle")}
        description={t("paymentHint")}
      />
    </AccountShell>
  );
}
