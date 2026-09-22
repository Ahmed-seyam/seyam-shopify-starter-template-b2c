"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, FieldError, Input, Label } from "@/components/ui";
import { reset } from "../_actions/reset";
import { idleAuthState, type AuthState } from "../_types";
import { erroredFields } from "@/app/[locale]/_utils";
import { resetSchema } from "@/validation/auth";

/** `resetUrl` is Shopify's reset_password_url, forwarded by the emailed link. */
export function ResetForm({ resetUrl }: { resetUrl: string }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      const parsed = resetSchema.safeParse({
        password: formData.get("password"),
      });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const f of erroredFields(parsed.error)) {
          fieldErrors[f] = t("errors.passwordTooShort");
        }
        return { error: null, fieldErrors };
      }
      return reset(prev, formData);
    },
    idleAuthState,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="resetUrl" value={resetUrl} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("newPassword")}</Label>
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
        {pending ? t("submitting") : t("resetSubmit")}
      </Button>
    </form>
  );
}
