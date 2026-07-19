import "server-only";
import { storefrontMutation } from "@/app/core/shopify/client";
import { getCustomerToken } from "@/app/core/shopify/customer-session";
import { getSession } from "@/app/core/shopify/session";
import { parseLocale } from "@/i18n/routing";
import { CART_BUYER_IDENTITY_UPDATE_MUTATION } from "../mutations/cart-buyer-identity-update";
import { CART_SESSION, type CartPayload } from "./shared";

/**
 * Buyer identity carries the storefront into Shopify's hosted checkout:
 * `customerAccessToken` attributes the order to the signed-in customer (email
 * + addresses prefilled), `countryCode` pins the market/currency.
 *
 * cartBuyerIdentityUpdate REPLACES the identity — it does not merge — so every
 * field we want to keep MUST be sent together. Country-sync and auth-sync
 * therefore share this one builder; updating only country would silently drop
 * the customer link (and vice versa).
 */
export type BuyerIdentityInput = {
  countryCode?: string;
  customerAccessToken?: string;
};

/** Full desired identity for the CURRENT locale + auth state (used on updates). */
export async function buildBuyerIdentity(
  locale?: string,
): Promise<BuyerIdentityInput> {
  const country = locale ? parseLocale(locale).country : undefined;
  const token = await getCustomerToken();
  return {
    ...(country ? { countryCode: country } : {}),
    ...(token ? { customerAccessToken: token } : {}),
  };
}

/**
 * Identity to seed a NEW cart with. Undefined for guests so cart creation keeps
 * its existing @inContext-driven currency behaviour unchanged; signed-in carts
 * are linked to the customer from the moment they are created.
 */
export async function buyerIdentityForNewCart(
  locale?: string,
): Promise<BuyerIdentityInput | undefined> {
  const token = await getCustomerToken();
  if (!token) return undefined;
  const country = locale ? parseLocale(locale).country : undefined;
  return {
    customerAccessToken: token,
    ...(country ? { countryCode: country } : {}),
  };
}

/**
 * Reconcile the existing cart's buyer identity with the current auth state.
 * Call after any sign-in (attach the token) or sign-out (drop it, so a guest
 * can't check out as the previous customer). Best-effort — a failure here must
 * never block the auth redirect.
 */
export async function syncCartBuyerIdentity(locale: string): Promise<void> {
  const cartId = await getSession("cart");
  if (!cartId) return;

  try {
    await storefrontMutation<CartPayload>(
      "cartBuyerIdentityUpdate",
      CART_BUYER_IDENTITY_UPDATE_MUTATION,
      {
        variables: { cartId, buyerIdentity: await buildBuyerIdentity(locale) },
        locale,
        session: CART_SESSION,
      },
    );
  } catch (error) {
    console.warn("[cart] buyer identity sync failed", error);
  }
}
