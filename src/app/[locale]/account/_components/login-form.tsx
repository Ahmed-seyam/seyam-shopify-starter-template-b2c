"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { Link } from "@/i18n/navigation";
// Server Actions are imported from their 'use server' file directly, never via
// the domain barrel (the barrel would pull server-only code into the bundle).
import { login } from "../_actions/login";
import { idleAuthState, type AuthState } from "../_types";
import { erroredFields } from "@/app/[locale]/_utils";
import { loginSchema } from "@/validation/auth";

export function LoginForm() {
  const t = useTranslations("account");
  const locale = useLocale();
  // Client-side format check against the shared schema — never reveals whether
  // an account exists (that stays the server's generic message); it only flags
  // an empty/malformed field before the request is made.
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      const parsed = loginSchema.safeParse({
        email: formData.get("email"),
        password: formData.get("password"),
      });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const f of erroredFields(parsed.error)) {
          fieldErrors[f] =
            f === "email" ? t("errors.emailInvalid") : t("errors.required");
        }
        return { error: null, fieldErrors };
      }
      return login(prev, formData);
    },
    idleAuthState,
  );

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

      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <Link
            href="/account/recover"
            className="text-xs text-muted-foreground underline-offset-4 hover:underline"
          >
            {t("forgotPassword")}
          </Link>
        </div>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          aria-invalid={state.fieldErrors?.password ? true : undefined}
        />
        <FieldError>{state.fieldErrors?.password}</FieldError>
      </div>

      {state.error && (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <Button type="submit" size="lg" disabled={pending}>
        {pending ? t("submitting") : t("loginSubmit")}
      </Button>
    </form>
  );
}
