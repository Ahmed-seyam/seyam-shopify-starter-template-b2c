import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  customerAccountsEnabled,
  getCustomerToken,
} from "@/plugins/server/shopify/customer-session";
import { AuthLayout, RegisterForm } from "@/app/[locale]/account";
import { Link, redirect } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("registerTitle") };
}

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  if (!customerAccountsEnabled()) {
    return <AuthLayout title={t("title")} description={t("notConfigured")} />;
  }
  if (await getCustomerToken()) redirect({ href: "/account", locale });

  return (
    <AuthLayout
      title={t("registerTitle")}
      description={t("registerSubtitle")}
      footer={
        <>
          {t("haveAccount")}{" "}
          <Link
            href="/account/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("loginCta")}
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthLayout>
  );
}
