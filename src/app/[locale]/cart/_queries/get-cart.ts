import { CART_FRAGMENT } from "@/app/fragments";

export const GET_CART_QUERY = /* GraphQL */ `
  query getCart(
    $cartId: ID!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    cart(id: $cartId) {
      ...CartFragment
    }
  }
  ${CART_FRAGMENT}
`;
