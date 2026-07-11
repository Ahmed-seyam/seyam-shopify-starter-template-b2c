import { PRODUCT_CARD_FRAGMENT } from "@/core/shopify/fragments";

export const PREDICTIVE_SEARCH_QUERY = /* GraphQL */ `
  query predictiveSearch(
    $query: String!
    $limit: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    predictiveSearch(query: $query, limit: $limit, types: [PRODUCT]) {
      products {
        ...ProductCardFragment
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
