"use client";

import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";
import { Button, Checkbox, Field, Input, Label, toast } from "@/components/ui";
// Direct action import — the domain barrel must stay free of server-only code.
import { updateProfile } from "../_actions/update-profile";
import { idleAuthState, type AuthState, type Customer } from "../_types";
import { erroredFields } from "@/app/[locale]/_utils";
import { profileSchema } from "@/validation/account";

export function ProfileForm({ customer }: { customer: Customer }) {
  const t = useTranslations("account");
  const locale = useLocale();

  const [state, formAction, pending] = useActionState(
    async (prev: AuthState, formData: FormData): Promise<AuthState> => {
      const parsed = profileSchema.safeParse({
        firstName: formData.get("firstName"),
        lastName: formData.get("lastName"),
        email: formData.get("email"),
        password: formData.get("password") ?? "",
        acceptsMarketing: formData.get("acceptsMarketing") === "on",
      });
      if (!parsed.success) {
        const fieldErrors: Record<string, string> = {};
        for (const f of erroredFields(parsed.error)) {
          fieldErrors[f] =
            f === "email"
              ? t("errors.emailInvalid")
              : f === "password"
                ? t("errors.passwordTooShort")
                : t("errors.required");
        }
        return { error: null, fieldErrors };
      }
      const result = await updateProfile(prev, formData);
      if (result.ok) toast.success(t("profileSaved"));
      return result;
    },
    idleAuthState,
  );

  return (
    <form action={formAction} className="flex max-w-lg flex-col gap-4">
      <input type="hidden" name="locale" value={locale} />

      <div className="grid gap-4 sm:grid-cols-2">
        <Field
          label={t("firstName")}
          htmlFor="profile-first"
          required
          error={state.fieldErrors?.firstName}
        >
          <Input
            id="profile-first"
            name="firstName"
            autoComplete="given-name"
            defaultValue={customer.firstName ?? ""}
            required
          />
        </Field>
        <Field
          label={t("lastName")}
          htmlFor="profile-last"
          required
          error={state.fieldErrors?.lastName}
        >
          <Input
            id="profile-last"
            name="lastName"
            autoComplete="family-name"
            defaultValue={customer.lastName ?? ""}
            required
          />
        </Field>
      </div>

      <Field
        label={t("email")}
        htmlFor="profile-email"
        required
        error={state.fieldErrors?.email}
      >
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
        error={state.fieldErrors?.password}
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
