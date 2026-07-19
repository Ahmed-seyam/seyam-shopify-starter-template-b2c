import { useTranslations } from "next-intl";
import { Heading, RatingStars } from "@/components/ui";
import { ReviewDialog } from "./review-dialog";

export type Review = {
  id: string;
  rating: number;
  title: string;
  body: string;
  author: string;
  date: string;
};

/**
 * PDP reviews block. Presentation-complete; pass `reviews` once a reviews
 * backend is wired (submission is already a stub action).
 */
export function ReviewsSection({
  productTitle,
  reviews = [],
}: {
  productTitle: string;
  reviews?: Review[];
}) {
  const t = useTranslations("reviews");
  const count = reviews.length;
  const average =
    count > 0
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / count
      : 0;

  return (
    <section id="reviews" className="border-t border-border pt-10">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Heading level={3}>{t("title")}</Heading>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <RatingStars value={average} size="sm" />
            <span>
              {count > 0
                ? t("summary", { average: average.toFixed(1), count })
                : t("empty")}
            </span>
          </div>
        </div>
        <ReviewDialog productTitle={productTitle} />
      </div>

      {count > 0 && (
        <ul className="grid gap-6 md:grid-cols-2">
          {reviews.map((review) => (
            <li
              key={review.id}
              className="rounded-lg border border-border bg-surface p-5"
            >
              <RatingStars value={review.rating} size="sm" className="mb-2" />
              <p className="font-medium text-foreground">{review.title}</p>
              <p className="mt-1 text-sm leading-relaxed text-body">
                {review.body}
              </p>
              <p className="mt-3 text-xs text-muted-foreground">
                {review.author} · {review.date}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
