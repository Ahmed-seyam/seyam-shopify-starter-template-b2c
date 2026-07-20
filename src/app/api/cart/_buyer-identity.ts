import "server-only";
import { parseLocale } from "@/i18n/routing";
import { getCustomerToken } from "@/plugins/server/shopify/customer-session";

/**
 * Buyer identity carries the storefront into Shopify's hosted checkout:
 * `customerAccessToken` attributes the order to the signed-in customer,
 * `countryCode` pins the market/currency.
 *
 * cartBuyerIdentityUpdate REPLACES the identity — it does not merge — so every
 * field we want to keep MUST be sent together.
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
 * its @inContext-driven currency behaviour unchanged; signed-in carts are
 * linked to the customer from the moment they are created.
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
