import { useTranslations } from "next-intl";
import { Container, RatingStars } from "@/app/core/ui";

const items = ["one", "two", "three"] as const;

export function Testimonials() {
  const t = useTranslations("home.testimonials");

  return (
    <Container className="pb-12">
      <ul className="grid gap-8 border-y border-border py-9 md:grid-cols-3 md:gap-6">
        {items.map((item) => (
          <li key={item}>
            <RatingStars value={5} size="sm" className="mb-2 text-rating" />
            <blockquote className="mb-2 text-sm leading-relaxed text-body">
              “{t(`${item}.quote`)}”
            </blockquote>
            <cite className="text-[0.78125rem] text-muted-foreground not-italic">
              {t(`${item}.author`)}
            </cite>
          </li>
        ))}
      </ul>
    </Container>
  );
}
