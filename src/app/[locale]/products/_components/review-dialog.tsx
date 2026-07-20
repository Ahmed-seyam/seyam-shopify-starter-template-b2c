"use client";

import { useTranslations } from "next-intl";
import { useActionState, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Field,
  Input,
  RatingStars,
  Textarea,
} from "@/components/ui";
import {
  submitReview,
  type ReviewState,
} from "../_actions/submit-review";
import { reviewSchema } from "@/validation/product";
import { erroredFields } from "@/app/[locale]/_utils";

const initialState: ReviewState = { status: "idle" };

export function ReviewDialog({ productTitle }: { productTitle: string }) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(5);
  // Same shared schema the action validates against — run client-side first so
  // field errors show instantly and no invalid submit hits the server.
  const [state, action, pending] = useActionState(
    async (prev: ReviewState, formData: FormData): Promise<ReviewState> => {
      const parsed = reviewSchema.safeParse({
        rating: formData.get("rating"),
        title: formData.get("title"),
        body: formData.get("body"),
        name: formData.get("name"),
      });
      if (!parsed.success) {
        const fieldErrors: ReviewState["fieldErrors"] = {};
        for (const key of erroredFields(parsed.error)) {
          // Translated message keyed by field — never leak raw zod strings.
          fieldErrors[key as keyof NonNullable<ReviewState["fieldErrors"]>] =
            t(`invalid.${key}`);
        }
        return { status: "error", fieldErrors };
      }
      return submitReview(prev, formData);
    },
    initialState,
  );

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          {t("write")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("dialogTitle")}</DialogTitle>
          <DialogDescription>{productTitle}</DialogDescription>
        </DialogHeader>

        {state.status === "success" ? (
          <Alert variant="success" title={t("thanksTitle")}>
            {t("thanksBody")}
          </Alert>
        ) : (
          <form action={action} className="grid gap-4">
            <input type="hidden" name="rating" value={rating} />
            <Field label={t("rating")} error={state.fieldErrors?.rating}>
              <RatingStars
                value={rating}
                onChange={setRating}
                size="lg"
                label={t("rating")}
              />
            </Field>
            <Field
              label={t("reviewTitle")}
              htmlFor="review-title"
              error={state.fieldErrors?.title}
            >
              <Input id="review-title" name="title" required maxLength={120} />
            </Field>
            <Field
              label={t("reviewBody")}
              htmlFor="review-body"
              error={state.fieldErrors?.body}
            >
              <Textarea
                id="review-body"
                name="body"
                required
                minLength={10}
                maxLength={2000}
              />
            </Field>
            <Field
              label={t("yourName")}
              htmlFor="review-name"
              error={state.fieldErrors?.name}
            >
              <Input id="review-name" name="name" required maxLength={80} />
            </Field>
            {state.status === "error" && (
              <Alert variant="error">{t("error")}</Alert>
            )}
            <DialogFooter>
              <Button type="submit" disabled={pending}>
                {pending ? t("submitting") : t("submit")}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
