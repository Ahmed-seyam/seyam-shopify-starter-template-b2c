import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/app/core/shopify/customer-session";
import { getAddresses } from "@/app/[locale]/account/actions/get-addresses";
import { getCustomer } from "@/app/[locale]/account";
import { AccountShell } from "@/app/[locale]/account/components/account-shell";
import { AddressesView } from "@/app/[locale]/account/components/addresses-view";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("nav.addresses") };
}

export default async function AddressesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  if (!customerAccountsEnabled()) redirect(`/${locale}/account`);
  const customer = await getCustomer(locale);
  if (!customer) redirect(`/${locale}/account`);

  const [t, addresses] = await Promise.all([
    getTranslations("account"),
    getAddresses(locale),
  ]);

  return (
    <AccountShell locale={locale} title={t("nav.addresses")}>
      <AddressesView addresses={addresses} />
    </AccountShell>
  );
}
