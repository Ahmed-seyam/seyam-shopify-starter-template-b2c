import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  customerAccountsEnabled,
  getCustomerToken,
} from "@/core/shopify/customer-session";
import { AuthLayout, LoginForm } from "@/domains/customer";
import { Link, redirect } from "@/i18n/navigation";

// Reads the session cookie — always rendered per request.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("loginTitle") };
}

export default async function LoginPage({
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
      title={t("loginTitle")}
      description={t("loginSubtitle")}
      footer={
        <>
          {t("noAccount")}{" "}
          <Link
            href="/account/register"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("registerCta")}
          </Link>
        </>
      }
    >
      <LoginForm />
    </AuthLayout>
  );
}
