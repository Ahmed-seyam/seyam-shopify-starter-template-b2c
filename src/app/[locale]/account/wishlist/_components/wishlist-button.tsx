"use client";

import { HeartIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { IconButton, toast } from "@/components/ui";
import { cn } from "@/lib/utils";
import { useWishlist } from "./use-wishlist";

/** Heart toggle used on product cards and the product page. */
export function WishlistButton({
  handle,
  title,
  size = "sm",
  className,
}: {
  handle: string;
  /** Product title, used in the toast. */
  title?: string;
  size?: "sm" | "default";
  className?: string;
}) {
  const t = useTranslations("wishlist");
  const { has, toggle } = useWishlist();
  const active = has(handle);

  return (
    <IconButton
      variant="surface"
      size={size}
      aria-label={active ? t("remove") : t("add")}
      aria-pressed={active}
      className={className}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        const added = toggle(handle);
        toast(added ? t("addedToast", { title: title ?? "" }) : t("removedToast", { title: title ?? "" }));
      }}
    >
      <HeartIcon
        className={cn("transition-colors", active && "fill-sale text-sale")}
      />
    </IconButton>
  );
}
