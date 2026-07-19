import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/app/core/shopify/customer-session";
import { Text } from "@/app/core/ui";
import { getCustomer } from "@/app/[locale]/account";
import { AccountShell } from "@/app/[locale]/account/_components/account-shell";
import { ProfileForm } from "@/app/[locale]/account/_components/profile-form";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("nav.profile") };
}

export default async function ProfilePage({
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
    <AccountShell locale={locale} title={t("nav.profile")}>
      <Text variant="muted" className="mb-6">
        {t("profileHint")}
      </Text>
      <ProfileForm customer={customer} />
    </AccountShell>
  );
}
