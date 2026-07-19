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
} from "@/app/core/ui";
import {
  submitReview,
  type ReviewState,
} from "../actions/submit-review";

const initialState: ReviewState = { status: "idle" };

export function ReviewDialog({ productTitle }: { productTitle: string }) {
  const t = useTranslations("reviews");
  const [rating, setRating] = useState(5);
  const [state, action, pending] = useActionState(submitReview, initialState);

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
            <Field label={t("rating")}>
              <RatingStars
                value={rating}
                onChange={setRating}
                size="lg"
                label={t("rating")}
              />
            </Field>
            <Field label={t("reviewTitle")} htmlFor="review-title">
              <Input id="review-title" name="title" required maxLength={120} />
            </Field>
            <Field label={t("reviewBody")} htmlFor="review-body">
              <Textarea
                id="review-body"
                name="body"
                required
                minLength={10}
                maxLength={2000}
              />
            </Field>
            <Field label={t("yourName")} htmlFor="review-name">
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
