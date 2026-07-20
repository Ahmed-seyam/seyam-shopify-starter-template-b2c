import { ok, route } from "@/lib/server/api/route";
import { storefrontMutation } from "@/plugins/server/shopify/client";
import { getSession } from "@/plugins/server/shopify/session";
import { CART_LINES_REMOVE_MUTATION } from "../_mutations/cart-lines-remove";
import { CART_SESSION, isMissingLine, toCart, type CartPayload } from "../_shared";

type RemoveBody = { lineId: string; locale?: string };

/** POST /api/cart/remove-line — reached via removeLine (cart/_actions). */
export const POST = route(async (request) => {
  const { lineId, locale } = (await request.json()) as RemoveBody;

  const cartId = await getSession("cart");
  if (!cartId) return ok(null);

  const payload = await storefrontMutation<CartPayload>(
    "cartLinesRemove",
    CART_LINES_REMOVE_MUTATION,
    {
      variables: { cartId, lineIds: [lineId] },
      locale,
      tolerate: isMissingLine,
      session: CART_SESSION,
    },
  );

  return ok(toCart(payload));
});
