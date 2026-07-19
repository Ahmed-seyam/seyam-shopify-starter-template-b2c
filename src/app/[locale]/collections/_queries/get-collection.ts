import { PRODUCT_CARD_FRAGMENT } from "@/app/fragments";

export const GET_COLLECTION_QUERY = /* GraphQL */ `
  query getCollection(
    $handle: String!
    $first: Int!
    $sortKey: ProductCollectionSortKeys
    $reverse: Boolean
    $filters: [ProductFilter!]
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      seo {
        title
        description
      }
      products(
        first: $first
        sortKey: $sortKey
        reverse: $reverse
        filters: $filters
      ) {
        edges {
          node {
            ...ProductCardFragment
          }
        }
      }
    }
  }
  ${PRODUCT_CARD_FRAGMENT}
`;
