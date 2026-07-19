import { ArrowRightIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  Button,
  Carousel,
  Container,
  Eyebrow,
  Heading,
  ImageFrame,
  Text,
} from "@/app/core/ui";
import { Link } from "@/i18n/navigation";

export type HeroVariant = "split" | "full-bleed" | "collage";

type HeroProps = {
  /** Spec's alternative hero layouts, selectable per deployment. */
  variant?: HeroVariant;
  /** Slide image URLs; placeholders render when empty. */
  images?: string[];
};

export function Hero({ variant = "split", images = [] }: HeroProps) {
  const t = useTranslations("home.hero");
  const slides = images.length > 0 ? images : [null, null, null];

  if (variant === "full-bleed") {
    return (
      <Container className="pt-10">
        <div className="relative overflow-hidden rounded-xl">
          <Carousel showDots showArrows={false}>
            {slides.map((src, i) => (
              <ImageFrame
                key={i}
                src={src}
                alt={t("title")}
                ratio="wide"
                radius="none"
                priority={i === 0}
                className="md:aspect-[21/9]"
              />
            ))}
          </Carousel>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end gap-3.5 bg-gradient-to-t from-black/50 via-black/5 to-transparent p-9 text-center">
            <p className="text-xs tracking-[0.1em] text-white/85 uppercase">
              {t("eyebrow")}
            </p>
            <Heading level={2} asChild className="text-white">
              <h1>{t("title")}</h1>
            </Heading>
            <Button
              asChild
              size="sm"
              className="pointer-events-auto bg-white text-foreground hover:bg-white/90 dark:bg-white dark:text-background"
            >
              <Link href="/collections/all">{t("cta")}</Link>
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  if (variant === "collage") {
    return (
      <Container className="pt-10">
        <div className="grid overflow-hidden rounded-xl border border-border md:grid-cols-[1.4fr_1fr]">
          <ImageFrame
            src={slides[0]}
            alt={t("title")}
            ratio="auto"
            radius="none"
            priority
            className="min-h-64"
          />
          <div className="flex flex-col justify-center gap-2.5 bg-foreground p-8 text-background">
            <p className="text-[0.6875rem] tracking-[0.08em] text-background/60 uppercase">
              {t("eyebrow")}
            </p>
            <Heading level={3} asChild className="text-background">
              <h1>{t("title")}</h1>
            </Heading>
            <Link
              href="/collections/all"
              className="group inline-flex items-center gap-1.5 text-sm font-semibold text-accent-light"
            >
              {t("cta")}
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
            </Link>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <Container className="py-10 md:py-14">
      <div className="grid items-center gap-10 md:grid-cols-[1.1fr_1fr] md:gap-12">
        <div className="flex max-w-md flex-col gap-5">
          <Eyebrow>{t("eyebrow")}</Eyebrow>
          <Heading level={1}>{t("title")}</Heading>
          <Text className="text-muted-foreground">{t("body")}</Text>
          <div className="mt-2 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/collections/all">{t("cta")}</Link>
            </Button>
            <Button asChild variant="secondary">
              <Link href="/collections/new-arrivals">{t("secondaryCta")}</Link>
            </Button>
          </div>
        </div>
        <Carousel className="overflow-hidden rounded-xl">
          {slides.map((src, i) => (
            <ImageFrame
              key={i}
              src={src}
              alt={t("title")}
              ratio="landscape"
              radius="none"
              priority={i === 0}
              sizes="(max-width: 768px) 100vw, 50vw"
            />
          ))}
        </Carousel>
      </div>
    </Container>
  );
}
