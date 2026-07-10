"use client";

import { ShoppingBagIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/core/ui/button";
import { Link } from "@/i18n/navigation";

/**
 * Client-fetched so pages stay fully static (reading the cart cookie in a
 * server component would force every route dynamic). Re-fetches when a
 * mutation dispatches "cart:updated".
 */
export function CartBadge({ label }: { label: string }) {
  const [count, setCount] = useState(0);

  const refresh = useCallback(() => {
    fetch("/api/cart/count")
      .then((response) => response.json())
      .then((body: { count: number }) => setCount(body.count))
      .catch(() => {});
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener("cart:updated", refresh);
    return () => window.removeEventListener("cart:updated", refresh);
  }, [refresh]);

  return (
    <Button variant="ghost" size="sm" asChild>
      <Link href="/cart" aria-label={label}>
        <ShoppingBagIcon className="size-5" />
        {count > 0 && (
          <span className="min-w-5 rounded-full bg-primary px-1 text-center text-xs text-primary-foreground">
            {count}
          </span>
        )}
      </Link>
    </Button>
  );
}
