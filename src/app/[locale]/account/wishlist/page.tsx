import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { customerAccountsEnabled } from "@/app/core/shopify/customer-session";
import { Container, Heading } from "@/app/core/ui";
import { getCustomer } from "@/app/[locale]/account";
import { AccountShell } from "@/app/[locale]/account/components/account-shell";
import { WishlistView } from "@/app/[locale]/account/wishlist";

// Guests keep their wishlist too (localStorage) — the page never requires
// sign-in, but signed-in shoppers get the account chrome around it.
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("wishlist");
  return { title: t("title") };
}

export default async function WishlistPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("wishlist");

  const customer = customerAccountsEnabled() ? await getCustomer(locale) : null;

  if (customer) {
    return (
      <AccountShell locale={locale} title={t("title")}>
        <WishlistView />
      </AccountShell>
    );
  }

  return (
    <Container className="py-10 lg:py-14">
      <Heading level={1} className="mb-8">
        {t("title")}
      </Heading>
      <WishlistView />
    </Container>
  );
}
