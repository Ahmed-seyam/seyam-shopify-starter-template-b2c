"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button } from "@/core/ui";
import { Input } from "@/core/ui";
import { Label } from "@/core/ui";
import { reset } from "../actions/reset";
import { idleAuthState } from "../types";

/** `id` + `token` come from the emailed /account/reset/[id]/[token] link. */
export function ResetForm({ id, token }: { id: string; token: string }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [state, action, pending] = useActionState(reset, idleAuthState);

  return (
    <form action={action} className="flex flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="token" value={token} />

      <div className="flex flex-col gap-1.5">
        <Label htmlFor="password">{t("newPassword")}</Label>
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
        {pending ? t("submitting") : t("resetSubmit")}
      </Button>
    </form>
  );
}
