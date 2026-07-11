"use client";

import Image from "next/image";
import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useOptimistic, useState, useTransition } from "react";
import type { Money } from "@/core/shopify/types";
import { Button } from "@/core/ui/button";
import { Separator } from "@/core/ui/separator";
// Import the leaf module, not the domain barrel: the barrel re-exports
// server-only queries that must not enter this client bundle.
import { Price } from "@/domains/product/components/price";
import { Link } from "@/i18n/navigation";
// Direct import from the 'use server' files — see add-to-cart-button.tsx.
import { removeLine } from "../actions/remove-line";
import { updateLineQuantity } from "../actions/update-line-quantity";
import type { Cart, CartLine } from "../types";

const EMPTY_CART: Cart = {
  id: "",
  checkoutUrl: "",
  totalQuantity: 0,
  cost: {
    subtotalAmount: { amount: "0", currencyCode: "USD" },
    totalAmount: { amount: "0", currencyCode: "USD" },
  },
  lines: [],
};

type OptimisticEvent =
  | { type: "remove"; lineId: string }
  | { type: "quantity"; lineId: string; quantity: number };

function money(amount: number, currencyCode: string): Money {
  return { amount: amount.toFixed(2), currencyCode };
}

// Client-side projection of a mutation so the UI moves instantly; the real
// cart (with authoritative tax/discount math) replaces it when the server
// action resolves.
function recompute(cart: Cart, lines: CartLine[]): Cart {
  const currency = cart.cost.subtotalAmount.currencyCode;
  const subtotal = lines.reduce(
    (sum, line) => sum + Number(line.cost.totalAmount.amount),
    0,
  );
  return {
    ...cart,
    lines,
    totalQuantity: lines.reduce((sum, line) => sum + line.quantity, 0),
    cost: {
      subtotalAmount: money(subtotal, currency),
      totalAmount: money(subtotal, currency),
    },
  };
}

function applyEvent(cart: Cart, event: OptimisticEvent): Cart {
  if (event.type === "remove") {
    return recompute(
      cart,
      cart.lines.filter((line) => line.id !== event.lineId),
    );
  }

  const lines = cart.lines.map((line) => {
    if (line.id !== event.lineId) return line;
    const unit = Number(line.cost.totalAmount.amount) / line.quantity;
    return {
      ...line,
      quantity: event.quantity,
      cost: {
        totalAmount: money(
          unit * event.quantity,
          line.cost.totalAmount.currencyCode,
        ),
      },
    };
  });
  return recompute(cart, lines);
}

export function CartView({ initialCart }: { initialCart: Cart | null }) {
  const locale = useLocale();
  const t = useTranslations("cart");
  const [cart, setCart] = useState<Cart>(initialCart ?? EMPTY_CART);
  const [optimisticCart, applyOptimistic] = useOptimistic(cart, applyEvent);
  const [pending, startTransition] = useTransition();

  function mutate(
    event: OptimisticEvent,
    action: () => Promise<Cart | null>,
  ) {
    startTransition(async () => {
      applyOptimistic(event);
      const updated = await action();
      // Reconcile with the server's authoritative cart (or empty it if the
      // cart cookie is gone) — no full-page refresh.
      setCart(updated ?? recompute(cart, []));
      window.dispatchEvent(new Event("cart:updated"));
    });
  }

  if (optimisticCart.lines.length === 0) {
    return (
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-4 px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-muted-foreground">{t("empty")}</p>
        <Button asChild>
          <Link href="/">{t("continueShopping")}</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold">{t("title")}</h1>

      <ul className="flex flex-col gap-4">
        {optimisticCart.lines.map((line) => (
          <li key={line.id} className="flex gap-4">
            <div className="relative size-20 shrink-0 overflow-hidden rounded-md bg-muted">
              {line.merchandise.image && (
                <Image
                  src={line.merchandise.image.url}
                  alt={
                    line.merchandise.image.altText ??
                    line.merchandise.product.title
                  }
                  fill
                  sizes="80px"
                  className="object-cover"
                />
              )}
            </div>
            <div className="flex flex-1 flex-col">
              <Link
                href={`/products/${line.merchandise.product.handle}`}
                className="font-medium hover:underline"
              >
                {line.merchandise.product.title}
              </Link>
              {line.merchandise.title !== "Default Title" && (
                <span className="text-sm text-muted-foreground">
                  {line.merchandise.title}
                </span>
              )}
              <div className="mt-auto flex items-center justify-between">
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={t("decrease")}
                    onClick={() =>
                      line.quantity <= 1
                        ? mutate({ type: "remove", lineId: line.id }, () =>
                            removeLine(line.id, locale),
                          )
                        : mutate(
                            {
                              type: "quantity",
                              lineId: line.id,
                              quantity: line.quantity - 1,
                            },
                            () =>
                              updateLineQuantity(
                                line.id,
                                line.quantity - 1,
                                locale,
                              ),
                          )
                    }
                  >
                    <MinusIcon />
                  </Button>
                  <span className="w-8 text-center text-sm tabular-nums">
                    {line.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={t("increase")}
                    onClick={() =>
                      mutate(
                        {
                          type: "quantity",
                          lineId: line.id,
                          quantity: line.quantity + 1,
                        },
                        () =>
                          updateLineQuantity(
                            line.id,
                            line.quantity + 1,
                            locale,
                          ),
                      )
                    }
                  >
                    <PlusIcon />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={pending}
                    aria-label={t("remove")}
                    onClick={() =>
                      mutate({ type: "remove", lineId: line.id }, () =>
                        removeLine(line.id, locale),
                      )
                    }
                  >
                    <Trash2Icon />
                  </Button>
                </div>
                <Price money={line.cost.totalAmount} />
              </div>
            </div>
          </li>
        ))}
      </ul>

      <Separator className="my-6" />

      <div className="flex items-center justify-between text-lg font-semibold">
        <span>{t("subtotal")}</span>
        <Price money={optimisticCart.cost.subtotalAmount} />
      </div>
      <p className="mt-1 text-sm text-muted-foreground">{t("taxNote")}</p>

      <Button size="lg" className="mt-6 w-full" asChild>
        {/* Checkout is always Shopify-hosted — payments never touch this app. */}
        <a href={optimisticCart.checkoutUrl}>{t("checkout")}</a>
      </Button>
    </div>
  );
}
