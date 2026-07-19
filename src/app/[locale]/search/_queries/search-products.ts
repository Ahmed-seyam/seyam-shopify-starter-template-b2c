import { PRODUCT_CARD_FRAGMENT } from "@/app/fragments";

export const SEARCH_QUERY = /* GraphQL */ `
  query searchProducts(
    $query: String!
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    search(query: $query, first: $first, types: [PRODUCT]) {
      edges {
        node {
          ... on Product {
            ...ProductCardFragment
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
