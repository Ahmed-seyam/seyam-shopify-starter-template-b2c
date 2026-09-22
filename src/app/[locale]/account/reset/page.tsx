import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/plugins/server/shopify/customer-session";
import { AuthLayout, ResetForm } from "@/app/[locale]/account";
import { Link } from "@/i18n/navigation";
import { resetUrlSchema } from "@/validation/auth";

// Reached from Shopify's password-reset email, whose link must be
// /account/reset?reset_url={{ customer.reset_password_url | url_encode }}.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("account");
  return { title: t("resetTitle") };
}

export default async function ResetPasswordPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ reset_url?: string | string[] }>;
}) {
  const { locale } = await params;
  const { reset_url } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("account");

  if (!customerAccountsEnabled()) {
    return <AuthLayout title={t("title")} description={t("notConfigured")} />;
  }

  const backToLogin = (
    <Link
      href="/account/login"
      className="font-medium text-foreground underline-offset-4 hover:underline"
    >
      {t("backToLogin")}
    </Link>
  );

  const resetUrl = resetUrlSchema.safeParse(reset_url);
  if (!resetUrl.success) {
    return (
      <AuthLayout
        title={t("resetTitle")}
        description={t("errors.resetLinkInvalid")}
        footer={
          <Link
            href="/account/recover"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            {t("recoverTitle")}
          </Link>
        }
      />
    );
  }

  return (
    <AuthLayout
      title={t("resetTitle")}
      description={t("resetHint")}
      footer={backToLogin}
    >
      <ResetForm resetUrl={resetUrl.data} />
    </AuthLayout>
  );
}
