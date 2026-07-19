import { IMAGE_FRAGMENT, MONEY_FRAGMENT } from "@/app/core/shopify/fragments";

export const GET_PRODUCT_QUERY = /* GraphQL */ `
  query getProduct(
    $handle: String!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    product(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      vendor
      tags
      availableForSale
      featuredImage {
        ...ImageFragment
      }
      priceRange {
        minVariantPrice {
          ...MoneyFragment
        }
        maxVariantPrice {
          ...MoneyFragment
        }
      }
      compareAtPriceRange {
        maxVariantPrice {
          ...MoneyFragment
        }
      }
      options {
        name
        optionValues {
          name
        }
      }
      images(first: 20) {
        edges {
          node {
            ...ImageFragment
          }
        }
      }
      variants(first: 100) {
        edges {
          node {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              ...MoneyFragment
            }
            compareAtPrice {
              ...MoneyFragment
            }
          }
        }
      }
      seo {
        title
        description
      }
    }
  }
  ${IMAGE_FRAGMENT}
  ${MONEY_FRAGMENT}
`;
