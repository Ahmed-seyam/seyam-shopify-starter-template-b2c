import { PRODUCT_CARD_FRAGMENT } from "@/fragments";

/**
 * Builds an aliased product-by-handle lookup:
 *
 *   p0: product(handle: "…") { …ProductCardFragment }
 *   p1: product(handle: "…") { …ProductCardFragment }
 *
 * The Storefront API's `products(query:)` search does NOT support a `handle:`
 * field (unlike the Admin API) — it silently ignores it and returns arbitrary
 * products — so handles must be resolved one-by-one via `product(handle:)`.
 * Aliases keep it to a single round-trip.
 *
 * Handles are interpolated into the query string, so callers MUST validate them
 * (`/^[\w-]+$/`) first — the route does this before calling here.
 */
export function buildProductsByHandlesQuery(handles: string[]): string {
  const aliases = handles
    .map(
      (handle, i) =>
        `p${i}: product(handle: "${handle}") { ...ProductCardFragment }`,
    )
    .join("\n      ");

  return /* GraphQL */ `
    query getProductsByHandles($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
      ${aliases}
    }
    ${PRODUCT_CARD_FRAGMENT}
  `;
}
