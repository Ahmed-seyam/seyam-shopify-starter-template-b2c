"use client";

import { useTranslations } from "next-intl";
import { useActionState } from "react";
import { Alert, Button, Container, Heading, Input, Text } from "@/components/ui";
import {
  subscribeNewsletter,
  type SubscribeState,
} from "@/app/[locale]/pages/_actions/subscribe-newsletter";

const initialState: SubscribeState = { status: "idle" };

export function Newsletter() {
  const t = useTranslations("home.newsletter");
  const [state, action, pending] = useActionState(
    subscribeNewsletter,
    initialState
  );

  return (
    <section className="bg-surface py-10">
      <Container className="flex flex-col items-center gap-3.5 text-center">
        <Heading level={3}>{t("title")}</Heading>
        <Text variant="muted" className="max-w-md">
          {t("body")}
        </Text>
        {state.status === "success" ? (
          <Alert variant="success" className="max-w-sm">
            {t("success")}
          </Alert>
        ) : (
          <form action={action} className="flex w-full max-w-sm gap-2.5">
            <Input
              type="email"
              name="email"
              required
              placeholder={t("placeholder")}
              aria-label={t("placeholder")}
              className="flex-1"
            />
            <Button type="submit" variant="dark" disabled={pending}>
              {t("submit")}
            </Button>
          </form>
        )}
        {state.status === "error" && (
          <p className="text-xs text-destructive">{t("error")}</p>
        )}
      </Container>
    </section>
  );
}
