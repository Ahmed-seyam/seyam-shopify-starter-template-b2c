import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/plugins/server/shopify/customer-session";
import { AuthLayout, ResetForm } from "@/app/[locale]/account";
import { Link } from "@/i18n/navigation";

// Reached from Shopify's password-reset email: /account/reset/{id}/{token}.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string; id: string; token: string }>;
}) {
  const { locale, id, token } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  if (!customerAccountsEnabled()) {
    return <AuthLayout title={t("title")} description={t("notConfigured")} />;
  }

  return (
    <AuthLayout
      title={t("resetTitle")}
      description={t("resetHint")}
      footer={
        <Link
          href="/account/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      }
    >
      <ResetForm id={id} token={token} />
    </AuthLayout>
  );
}
