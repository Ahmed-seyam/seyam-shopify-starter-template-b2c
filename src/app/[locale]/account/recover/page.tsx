import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/core/shopify/customer-session";
import { AuthLayout, RecoverForm } from "@/domains/customer";
import { Link } from "@/i18n/navigation";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("recoverTitle") };
}

export default async function RecoverPage({
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

  return (
    <AuthLayout
      title={t("recoverTitle")}
      description={t("recoverHint")}
      footer={
        <Link
          href="/account/login"
          className="font-medium text-foreground underline-offset-4 hover:underline"
        >
          {t("backToLogin")}
        </Link>
      }
    >
      <RecoverForm />
    </AuthLayout>
  );
}
