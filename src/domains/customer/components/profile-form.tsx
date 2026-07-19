"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, Checkbox, Field, Input, Label, toast } from "@/core/ui";
// Direct action import — the domain barrel must stay free of server-only code.
import { updateProfile } from "../actions/update-profile";
import { idleAuthState, type AuthState, type Customer } from "../types";

export function ProfileForm({ customer }: { customer: Customer }) {
  const t = useTranslations("account");
  const locale = useLocale();

  const [state, formAction, pending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await updateProfile(prev, formData);
      if (result.ok) toast.success(t("profileSaved"));
      return result;
    },
    idleAuthState
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label={t("firstName")} htmlFor="profile-first" required>
          <Input
            id="profile-first"
            name="firstName"
            autoComplete="given-name"
            defaultValue={customer.firstName ?? ""}
            required
          />
        </Field>
        <Field label={t("lastName")} htmlFor="profile-last" required>
          <Input
            id="profile-last"
            name="lastName"
            autoComplete="family-name"
            defaultValue={customer.lastName ?? ""}
            required
          />
        </Field>
      </div>

      <Field label={t("email")} htmlFor="profile-email" required>
        <Input
          id="profile-email"
          name="email"
          type="email"
          autoComplete="email"
          defaultValue={customer.email ?? ""}
          required
        />
      </Field>

      <Field
        label={t("newPassword")}
        htmlFor="profile-password"
        hint={t("passwordOptionalHint")}
      >
        <Input
          id="profile-password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={8}
        />
      </Field>

      <div className="flex items-center gap-2.5">
        <Checkbox
          id="profile-marketing"
          name="acceptsMarketing"
          defaultChecked={customer.acceptsMarketing}
        />
        <Label htmlFor="profile-marketing" className="font-normal">
          {t("marketingLabel")}
        </Label>
      </div>

      {state.error && (
        <p aria-live="polite" className="text-sm text-destructive">
          {state.error}
        </p>
      )}

      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("submitting") : t("saveProfile")}
        </Button>
      </div>
    </form>
  );
}
