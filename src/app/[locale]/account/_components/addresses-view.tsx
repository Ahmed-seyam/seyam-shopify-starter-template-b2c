"use client";

import { useLocale, useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { useActionState, useState } from "react";
import {
  Badge,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  Field,
  Input,
  toast,
} from "@/components/ui";
// Server Actions are imported from their 'use server' file directly, never via
// the domain barrel (the barrel would pull server-only code into the bundle).
import {
  deleteAddress,
  saveAddress,
  setDefaultAddress,
} from "../_actions/address-crud";
import { idleAuthState, type AuthState, type CustomerAddress } from "../_types";

export function AddressesView({ addresses }: { addresses: CustomerAddress[] }) {
  const t = useTranslations("account");
  const locale = useLocale();
  const [open, setOpen] = useState(false);
  // The address being edited; null = the "add" form. Keyed into the dialog so
  // switching targets resets the uncontrolled inputs.
  const [editing, setEditing] = useState<CustomerAddress | null>(null);

  const [state, formAction, pending] = useActionState(
    async (prev: AuthState, formData: FormData) => {
      const result = await saveAddress(prev, formData);
      if (result.ok) {
        setOpen(false);
        toast.success(t("addressSaved"));
      }
      return result;
    },
    idleAuthState
  );

  const openFor = (address: CustomerAddress | null) => {
    setEditing(address);
    setOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">{t("addressesHint")}</p>
        <Button size="sm" onClick={() => openFor(null)}>
          <PlusIcon />
          {t("addAddress")}
        </Button>
      </div>

      {addresses.length === 0 ? (
        <EmptyState
          title={t("noAddresses")}
          action={
            <Button onClick={() => openFor(null)}>{t("addAddress")}</Button>
          }
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <Card key={address.id}>
              <CardContent className="flex h-full flex-col gap-3">
                <div className="flex items-start justify-between gap-2">
                  <span className="font-medium text-foreground">
                    {[address.firstName, address.lastName]
                      .filter(Boolean)
                      .join(" ")}
                  </span>
                  {address.isDefault && (
                    <Badge variant="accent">{t("defaultAddress")}</Badge>
                  )}
                </div>
                <address className="flex-1 text-sm text-body not-italic">
                  {[
                    address.address1,
                    address.address2,
                    [address.city, address.province, address.zip]
                      .filter(Boolean)
                      .join(", "),
                    address.country,
                    address.phone,
                  ]
                    .filter(Boolean)
                    .map((line) => (
                      <div key={line as string}>{line}</div>
                    ))}
                </address>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => openFor(address)}
                  >
                    {t("editAddress")}
                  </Button>
                  {!address.isDefault && (
                    <>
                      <form action={setDefaultAddress}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={address.id} />
                        <Button size="sm" variant="ghost" type="submit">
                          {t("setDefault")}
                        </Button>
                      </form>
                      <form action={deleteAddress}>
                        <input type="hidden" name="locale" value={locale} />
                        <input type="hidden" name="id" value={address.id} />
                        <Button
                          size="sm"
                          variant="ghost"
                          type="submit"
                          className="text-destructive hover:text-destructive"
                        >
                          {t("deleteAddress")}
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editing ? t("editAddress") : t("addAddress")}
            </DialogTitle>
          </DialogHeader>
          <form
            key={editing?.id ?? "new"}
            action={formAction}
            className="flex flex-col gap-4"
          >
            <input type="hidden" name="locale" value={locale} />
            {editing && <input type="hidden" name="id" value={editing.id} />}

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("firstName")} htmlFor="addr-first" required>
                <Input
                  id="addr-first"
                  name="firstName"
                  autoComplete="given-name"
                  defaultValue={editing?.firstName ?? ""}
                  required
                />
              </Field>
              <Field label={t("lastName")} htmlFor="addr-last" required>
                <Input
                  id="addr-last"
                  name="lastName"
                  autoComplete="family-name"
                  defaultValue={editing?.lastName ?? ""}
                  required
                />
              </Field>
            </div>

            <Field label={t("address1")} htmlFor="addr-1" required>
              <Input
                id="addr-1"
                name="address1"
                autoComplete="address-line1"
                defaultValue={editing?.address1 ?? ""}
                required
              />
            </Field>
            <Field label={t("address2")} htmlFor="addr-2">
              <Input
                id="addr-2"
                name="address2"
                autoComplete="address-line2"
                defaultValue={editing?.address2 ?? ""}
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label={t("city")} htmlFor="addr-city" required>
                <Input
                  id="addr-city"
                  name="city"
                  autoComplete="address-level2"
                  defaultValue={editing?.city ?? ""}
                  required
                />
              </Field>
              <Field label={t("province")} htmlFor="addr-province">
                <Input
                  id="addr-province"
                  name="province"
                  autoComplete="address-level1"
                  defaultValue={editing?.province ?? ""}
                />
              </Field>
              <Field label={t("zip")} htmlFor="addr-zip" required>
                <Input
                  id="addr-zip"
                  name="zip"
                  autoComplete="postal-code"
                  defaultValue={editing?.zip ?? ""}
                  required
                />
              </Field>
              <Field label={t("country")} htmlFor="addr-country" required>
                <Input
                  id="addr-country"
                  name="country"
                  autoComplete="country-name"
                  defaultValue={editing?.country ?? ""}
                  required
                />
              </Field>
            </div>

            <Field label={t("phone")} htmlFor="addr-phone">
              <Input
                id="addr-phone"
                name="phone"
                type="tel"
                autoComplete="tel"
                defaultValue={editing?.phone ?? ""}
              />
            </Field>

            {state.error && (
              <p aria-live="polite" className="text-sm text-destructive">
                {state.error}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpen(false)}
              >
                {t("cancel")}
              </Button>
              <Button type="submit" disabled={pending}>
                {pending ? t("submitting") : t("saveAddress")}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
