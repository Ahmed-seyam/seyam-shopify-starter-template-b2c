import { CART_FRAGMENT } from "@/app/fragments";

export const CART_BUYER_IDENTITY_UPDATE_MUTATION = /* GraphQL */ `
  mutation cartBuyerIdentityUpdate(
    $cartId: ID!
    $buyerIdentity: CartBuyerIdentityInput!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    cartBuyerIdentityUpdate(cartId: $cartId, buyerIdentity: $buyerIdentity) {
      cart {
        ...CartFragment
      }
      userErrors {
        field
        message
      }
    }
  }
  ${CART_FRAGMENT}
`;
