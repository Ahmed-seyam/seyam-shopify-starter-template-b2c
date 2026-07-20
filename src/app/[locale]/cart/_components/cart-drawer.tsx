"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import {
  Badge,
  Button,
  IconButton,
  Price,
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  Spinner,
} from "@/components/ui";
import { CheckoutButton } from "@/app/[locale]/checkout";
import { useCart } from "@/hooks/use-cart";
import { cartSummary, itemFromCartLine, track } from "@/plugins/client/tracking";
import { Link } from "@/i18n/navigation";
import type { CartLine as CartLineType } from "../_types";
import { CartLine } from "./cart-line";

/**
 * Header cart: badge trigger + slide-over drawer (spec #s-cart). Badge count
 * and cart contents both read the shared `['cart']` query — no separate
 * count fetch, no cross-component event bus.
 */
export function CartDrawer({
  checkoutMode,
}: {
  checkoutMode: "redirect" | "embedded";
}) {
  const t = useTranslations("cart");
  const [open, setOpen] = useState(false);
  const {
    cart,
    itemCount,
    isLoading,
    isMutating,
    updateQuantity,
    removeItem,
    refresh,
  } = useCart();

  const remove = (line: CartLineType) => {
    track.removeFromCart(itemFromCartLine(line));
    removeItem(line.id);
  };

  const setQuantity = (line: CartLineType, quantity: number) => {
    if (quantity <= 0) return remove(line);
    updateQuantity(line.id, quantity);
  };

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    // Revalidate against the server when the drawer opens.
    if (next) refresh();
  };

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <IconButton aria-label={t("title")} className="relative">
          <ShoppingBagIcon />
          {itemCount > 0 && (
            <Badge variant="count" className="absolute top-0.5 end-0.5 h-4 min-w-4">
              {itemCount}
            </Badge>
          )}
        </IconButton>
      </SheetTrigger>

      <SheetContent side="end" className="gap-0">
        <SheetHeader className="border-b border-border">
          <SheetTitle className="font-serif text-lg">
            {t("title")}
            {itemCount > 0 && (
              <span className="ms-2 text-sm font-normal text-muted-foreground">
                ({itemCount})
              </span>
            )}
          </SheetTitle>
        </SheetHeader>

        {isLoading ? (
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
                    pending={isMutating}
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
              {/* Capture-phase so the event fires before checkout navigation. */}
              <div
                onClickCapture={() => {
                  const { items, value, currency } = cartSummary(cart);
                  track.beginCheckout(items, value, currency);
                }}
              >
                <CheckoutButton
                  checkoutUrl={cart.checkoutUrl}
                  mode={checkoutMode}
                  label={t("checkout")}
                />
              </div>
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
