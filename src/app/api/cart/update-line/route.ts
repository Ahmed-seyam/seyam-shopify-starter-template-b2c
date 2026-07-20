import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getSession } from "@/plugins/server/shopify/session";
import { CART_LINES_REMOVE_MUTATION } from "../_mutations/cart-lines-remove";
import { CART_LINES_UPDATE_MUTATION } from "../_mutations/cart-lines-update";
import { CART_SESSION, isMissingLine, toCart, type CartPayload } from "../_shared";

type UpdateBody = { lineId: string; quantity: number; locale?: string };

/**
 * POST /api/cart/update-line — reached via updateLineQuantity (cart/_actions).
 * quantity <= 0 removes the line (same end-state the client stepper expects).
 */
export const POST = route(async (request) => {
  const { lineId, quantity, locale } = (await request.json()) as UpdateBody;

  const cartId = await getSession("cart");
  if (!cartId) return ok(null);

  const [operation, query, variables] =
    quantity <= 0
      ? ([
          "cartLinesRemove",
          CART_LINES_REMOVE_MUTATION,
          { cartId, lineIds: [lineId] },
        ] as const)
      : ([
          "cartLinesUpdate",
          CART_LINES_UPDATE_MUTATION,
          { cartId, lines: [{ id: lineId, quantity }] },
        ] as const);

  const payload = await storefrontMutation<CartPayload>(operation, query, {
    variables,
    locale,
    tolerate: isMissingLine,
    session: CART_SESSION,
  });

  return ok(toCart(payload));
});
