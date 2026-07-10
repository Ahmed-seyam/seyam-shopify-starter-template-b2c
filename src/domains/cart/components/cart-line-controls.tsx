"use client";

import { MinusIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useLocale } from "next-intl";
import { useTransition } from "react";
import { Button } from "@/core/ui/button";
// Direct import from the 'use server' file — see add-to-cart-button.tsx.
import {
  removeLine,
  updateLineQuantity,
} from "@/domains/cart/mutations/cart-actions";

export function CartLineControls({
  lineId,
  quantity,
  removeLabel,
}: {
  lineId: string;
  quantity: number;
  removeLabel: string;
}) {
  const locale = useLocale();
  const [pending, startTransition] = useTransition();

  function run(action: () => Promise<void>) {
    startTransition(async () => {
      await action();
      window.dispatchEvent(new Event("cart:updated"));
    });
  }

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        onClick={() =>
          run(() => updateLineQuantity(lineId, quantity - 1, locale))
        }
      >
        <MinusIcon />
      </Button>
      <span className="w-8 text-center text-sm tabular-nums">{quantity}</span>
      <Button
        variant="outline"
        size="icon-sm"
        disabled={pending}
        onClick={() =>
          run(() => updateLineQuantity(lineId, quantity + 1, locale))
        }
      >
        <PlusIcon />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={pending}
        aria-label={removeLabel}
        onClick={() => run(() => removeLine(lineId, locale))}
      >
        <Trash2Icon />
      </Button>
    </div>
  );
}
