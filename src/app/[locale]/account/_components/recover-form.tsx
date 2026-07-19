"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/components/ui";
import { Input } from "@/components/ui";
import { Label } from "@/components/ui";
import { recover } from "../_actions/recover";
import { idleAuthState } from "../_types";

export function RecoverForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(recover, idleAuthState);

  if (state.ok) {
    return (
      <p aria-live="polite" className="text-sm text-muted-foreground">
        {t("recoverSent")}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      {state.error && (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("submitting") : t("recoverSubmit")}
      </Button>
    </form>
  );
}
