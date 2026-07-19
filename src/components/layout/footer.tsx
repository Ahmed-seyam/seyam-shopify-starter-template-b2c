import { useTranslations } from "next-intl";
import { Container } from "@/components/ui";
import { Link } from "@/i18n/navigation";

const helpLinks = [
  { key: "shippingReturns", href: "/pages/shipping-returns" },
  { key: "contact", href: "/pages/contact" },
  { key: "faq", href: "/pages/faq" },
  { key: "sizeGuide", href: "/pages/size-guide" },
] as const;

const companyLinks = [
  { key: "privacy", href: "/pages/privacy-policy" },
  { key: "terms", href: "/pages/terms-of-service" },
  { key: "about", href: "/pages/about" },
] as const;

const socials = ["IG", "TW", "PI"] as const;
const paymentMethods = ["Visa", "Mastercard", "Amex", "PayPal"] as const;

export function Footer() {
  const t = useTranslations("footer");
  const tLayout = useTranslations("layout");

  return (
    <footer className="border-t border-border bg-surface">
      <Container className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
        <div className="flex flex-col gap-2.5">
          <p className="font-serif text-xl font-semibold tracking-wide uppercase">
            {tLayout("storeName")}
          </p>
          <p className="text-[0.8125rem] leading-relaxed text-muted-foreground">
            {t("tagline")}
          </p>
          <div className="mt-2 flex gap-2.5">
            {socials.map((social) => (
              <a
                key={social}
                href="#"
                aria-label={social}
                className="flex size-8 items-center justify-center rounded-md border border-border text-xs text-body transition-colors hover:border-foreground/40 hover:text-foreground"
              >
                {social}
              </a>
            ))}
          </div>
        </div>

        <FooterColumn title={t("help")}>
          {helpLinks.map((link) => (
            <FooterLink key={link.key} href={link.href}>
              {t(link.key)}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={t("company")}>
          {companyLinks.map((link) => (
            <FooterLink key={link.key} href={link.href}>
              {t(link.key)}
            </FooterLink>
          ))}
        </FooterColumn>

        <FooterColumn title={t("weAccept")}>
          <div className="flex flex-wrap gap-2">
            {paymentMethods.map((method) => (
              <span
                key={method}
                className="rounded-sm border border-border px-2.5 py-1.5 text-[0.6875rem] text-muted-foreground"
              >
                {method}
              </span>
            ))}
          </div>
        </FooterColumn>
      </Container>

      <div className="border-t border-border">
        <Container className="flex flex-col items-center justify-between gap-2 py-5 text-xs text-muted-foreground sm:flex-row">
          <p>
            © {new Date().getFullYear()} {tLayout("storeName")}. {t("rights")}
          </p>
          <p>{t("builtWith")}</p>
        </Container>
      </div>
    </footer>
  );
}

function FooterColumn({
  title,
  children,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-[0.8125rem] font-semibold tracking-[0.06em] text-muted-foreground uppercase">
        {title}
      </p>
      {children}
    </div>
  );
}

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-body transition-colors hover:text-foreground"
    >
      {children}
    </Link>
  );
}
