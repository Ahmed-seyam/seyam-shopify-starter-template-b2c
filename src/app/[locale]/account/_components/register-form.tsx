"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/app/core/ui";
import { Input } from "@/app/core/ui";
import { Label } from "@/app/core/ui";
import { register } from "../_actions/register";
import { idleAuthState } from "../_types";

export function RegisterForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(register, idleAuthState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="firstName">{t("firstName")}</Label>
          <Input
            id="firstName"
            name="firstName"
            autoComplete="given-name"
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="lastName">{t("lastName")}</Label>
          <Input id="lastName" name="lastName" autoComplete="family-name" />
        </div>
      </div>

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

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      {state.error && (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("submitting") : t("registerSubmit")}
      </Button>
    </form>
  );
}
