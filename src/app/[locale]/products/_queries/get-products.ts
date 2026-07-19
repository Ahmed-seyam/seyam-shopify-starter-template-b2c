import { PRODUCT_CARD_FRAGMENT } from "@/app/fragments";

export const GET_PRODUCTS_QUERY = /* GraphQL */ `
  query getProducts(
    $first: Int!
    $query: String
    $sortKey: ProductSortKeys
    $reverse: Boolean
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    products(first: $first, query: $query, sortKey: $sortKey, reverse: $reverse) {
      edges {
        node {
          ...ProductCardFragment
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
