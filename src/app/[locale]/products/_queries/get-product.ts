import { PRODUCT_FRAGMENT } from "@/app/fragments";

export const GET_PRODUCT_QUERY = /* GraphQL */ `
  query getProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      ...ProductFragment
    }
  }
  ${PRODUCT_FRAGMENT}
`;
