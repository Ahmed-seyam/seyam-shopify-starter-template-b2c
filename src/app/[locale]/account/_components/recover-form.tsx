"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { recover } from "../_actions/recover";
import { idleAuthState, type AuthState } from "../_types";
import { erroredFields } from "@/app/[locale]/_utils";
import { recoverSchema } from "@/validation/auth";

export function RecoverForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      const parsed = recoverSchema.safeParse({ email: formData.get("email") });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const f of erroredFields(parsed.error)) {
          fieldErrors[f] = t("errors.emailInvalid");
        }
        return { error: null, fieldErrors };
      }
      return recover(prev, formData);
    },
    idleAuthState,
  );

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
          aria-invalid={state.fieldErrors?.email ? true : undefined}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
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
