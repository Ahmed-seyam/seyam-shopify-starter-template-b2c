"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { register } from "../_actions/register";
import { idleAuthState, type AuthState } from "../_types";
import { erroredFields } from "@/app/[locale]/_utils";
import { registerSchema } from "@/validation/auth";

export function RegisterForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      const parsed = registerSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
        firstName: formData.get("firstName") || undefined,
        lastName: formData.get("lastName") || undefined,
      });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const f of erroredFields(parsed.error)) {
          fieldErrors[f] =
            f === "email"
              ? t("errors.emailInvalid")
              : t("errors.passwordTooShort");
        }
        return { error: null, fieldErrors };
      }
      return register(prev, formData);
    },
    idleAuthState,
  );

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
          aria-invalid={state.fieldErrors?.email ? true : undefined}
        />
        <FieldError>{state.fieldErrors?.email}</FieldError>
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
          aria-invalid={state.fieldErrors?.password ? true : undefined}
        />
        {state.fieldErrors?.password ? (
          <FieldError>{state.fieldErrors.password}</FieldError>
        ) : (
          <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
        )}
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
