"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCallback, useEffect, useState } from "react";
import { useLocale } from "next-intl";
import {
  Badge,
  Button,
  IconButton,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Spinner,
} from "@/core/ui";
import { CheckoutButton } from "@/domains/checkout";
import { Link } from "@/i18n/navigation";
// Direct 'use server' imports — never the barrel (server-only queries).
import { fetchCart } from "../actions/fetch-cart";
import { CartLine } from "./cart-line";
import { EMPTY_CART, useCartState } from "./use-cart-state";
import { Price } from "@/core/ui";

/**
 * Header cart: badge trigger + slide-over drawer (spec #s-cart). The count
 * stays client-fetched so pages remain static; the full cart loads when the
 * drawer opens.
 */
export function CartDrawer({
  checkoutMode,
}: {
  checkoutMode: "redirect" | "embedded";
}) {
  const t = useTranslations("cart");
  const locale = useLocale();

  const [open, setOpen] = useState(false);
  const [count, setCount] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const { cart, setCart, pending, setQuantity, remove } = useCartState(null);

  const refreshCount = useCallback(() => {
    fetch("/api/cart/count")
      .then((response) => response.json())
      .then((body: { count: number }) => setCount(body.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refreshCount();
    window.addEventListener("cart:updated", refreshCount);
    return () => window.removeEventListener("cart:updated", refreshCount);
  }, [refreshCount]);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setLoaded(false);
      fetchCart(locale).then((data) => {
        setCart(data ?? EMPTY_CART);
        setLoaded(true);
      });
    }
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <IconButton aria-label={t("title")} className="relative">
          <ShoppingBagIcon />
          {count > 0 && (
            <Badge variant="count" className="absolute top-0.5 end-0.5 h-4 min-w-4">
              {count}
            </Badge>
          )}
        </IconButton>
      </SheetTrigger>

      <SheetContent side="end" className="gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-serif text-lg">
            {t("title")}
            {cart.totalQuantity > 0 && (
              <span className="ms-2 text-sm font-normal text-muted-foreground">
                ({cart.totalQuantity})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {!loaded ? (
          <div className="flex flex-1 items-center justify-center">
            <Spinner className="size-5 text-muted-foreground" />
          </div>
        ) : cart.lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center">
            <ShoppingBagIcon className="size-8 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">{t("empty")}</p>
            <Button asChild variant="secondary" size="sm">
              <Link href="/" onClick={() => setOpen(false)}>
                {t("continueShopping")}
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <ul className="flex-1 space-y-5 overflow-y-auto p-4">
              {cart.lines.map((line) => (
                <li key={line.id}>
                  <CartLine
                    line={line}
                    density="drawer"
                    pending={pending}
                    onQuantityChange={setQuantity}
                    onRemove={remove}
                    onNavigate={() => setOpen(false)}
                  />
                </li>
              ))}
            </ul>

            <SheetFooter className="gap-3 border-t border-border">
              <p className="text-xs text-muted-foreground">
                {t("freeShippingNote")}
              </p>
              <div className="flex items-center justify-between text-[0.9375rem] font-semibold text-foreground">
                <span>{t("subtotal")}</span>
                <Price money={cart.cost.subtotalAmount} />
              </div>
              <CheckoutButton
                checkoutUrl={cart.checkoutUrl}
                mode={checkoutMode}
                label={t("checkout")}
              />
              <Button asChild variant="ghost" size="sm">
                <Link href="/cart" onClick={() => setOpen(false)}>
                  {t("viewCart")}
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
