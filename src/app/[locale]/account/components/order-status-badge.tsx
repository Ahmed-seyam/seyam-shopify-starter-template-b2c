import { Badge } from "@/app/core/ui";

/** Shopify enum → readable label; enum values are API-fixed, not locale keys. */
function humanize(status: string) {
  return status.toLowerCase().replace(/_/g, " ");
}

function variantFor(status: string): "accent" | "sale" | "outline" {
  if (status === "PAID" || status === "FULFILLED") return "accent";
  if (status.includes("REFUND") || status === "VOIDED") return "sale";
  return "outline";
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <Badge variant={variantFor(status)}>{humanize(status)}</Badge>;
}
