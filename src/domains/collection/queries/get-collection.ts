import { PRODUCT_CARD_FRAGMENT } from "@/core/shopify/fragments";

export const GET_COLLECTION_QUERY = /* GraphQL */ `
  query getCollection(
    $handle: String!
    $first: Int!
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
      products(first: $first, sortKey: BEST_SELLING) {
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
