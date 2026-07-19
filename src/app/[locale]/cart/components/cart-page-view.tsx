"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import {
  Button,
  Card,
  CardContent,
  Container,
  EmptyState,
  Heading,
  Input,
  Price,
  Separator,
} from "@/app/core/ui";
import { CheckoutButton } from "@/app/[locale]/checkout";
import { Link } from "@/i18n/navigation";
// Direct 'use server' imports — never the barrel (server-only queries).
import { applyDiscount } from "../actions/apply-discount";
import type { Cart } from "../types";
import { CartLine } from "./cart-line";
import { useCartState } from "./use-cart-state";

/** Cart page (spec #s-cartpage): lines + order-summary card. */
export function CartPageView({
  initialCart,
  checkoutMode,
}: {
  initialCart: Cart | null;
  checkoutMode: "redirect" | "embedded";
}) {
  const t = useTranslations("cart");
  const locale = useLocale();
  const { cart, setCart, pending, setQuantity, remove } =
    useCartState(initialCart);

  const [code, setCode] = useState("");
  const [discountState, setDiscountState] = useState<
    "idle" | "applied" | "rejected"
  >("idle");
  const [discountPending, startDiscount] = useTransition();

  if (cart.lines.length === 0) {
    return (
      <Container className="py-16">
        <EmptyState
          icon={<ShoppingBagIcon />}
          title={t("empty")}
          action={
            <Button asChild>
              <Link href="/">{t("continueShopping")}</Link>
            </Button>
          }
        />
      </Container>
    );
  }

  return (
    <Container className="py-8">
      <Heading level={2} asChild className="mb-7">
        <h1>{t("title")}</h1>
      </Heading>

      <div className="grid items-start gap-10 lg:grid-cols-[1fr_24rem]">
        <ul className="grid gap-6">
          {cart.lines.map((line) => (
            <li key={line.id} className="border-b border-border pb-6">
              <CartLine
                line={line}
                density="page"
                pending={pending}
                onQuantityChange={setQuantity}
                onRemove={remove}
              />
            </li>
          ))}
        </ul>

        <Card className="gap-4 py-5">
          <CardContent className="grid gap-4 px-5">
            <p className="font-serif text-lg font-medium text-foreground">
              {t("summary")}
            </p>

            <div className="flex items-center justify-between text-sm">
              <span className="text-body">{t("subtotal")}</span>
              <Price money={cart.cost.subtotalAmount} />
            </div>
            <p className="text-xs text-muted-foreground">{t("taxNote")}</p>

            <Separator />

            <form
              className="flex gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                if (!code.trim()) return;
                startDiscount(async () => {
                  const result = await applyDiscount(code, locale);
                  if (result.cart) setCart(result.cart);
                  setDiscountState(result.applied ? "applied" : "rejected");
                });
              }}
            >
              <Input
                value={code}
                onChange={(event) => {
                  setCode(event.target.value);
                  setDiscountState("idle");
                }}
                placeholder={t("discountPlaceholder")}
                aria-label={t("discountPlaceholder")}
                className="h-10 flex-1"
              />
              <Button
                type="submit"
                variant="secondary"
                size="sm"
                className="h-10"
                disabled={discountPending || !code.trim()}
              >
                {t("apply")}
              </Button>
            </form>
            {discountState === "applied" && (
              <p className="text-xs font-medium text-primary">
                {t("discountApplied")}
              </p>
            )}
            {discountState === "rejected" && (
              <p className="text-xs font-medium text-destructive">
                {t("discountRejected")}
              </p>
            )}

            <div className="flex items-center justify-between text-base font-semibold text-foreground">
              <span>{t("total")}</span>
              <Price money={cart.cost.totalAmount} />
            </div>

            <CheckoutButton
              checkoutUrl={cart.checkoutUrl}
              mode={checkoutMode}
              label={t("checkout")}
            />
            <Button asChild variant="ghost" size="sm">
              <Link href="/">{t("continueShopping")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </Container>
  );
}
