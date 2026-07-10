import "server-only";
import { productTag, TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import { IMAGE_FRAGMENT, MONEY_FRAGMENT } from "@/core/shopify/fragments";
import type { Product } from "../types";
import { reshapeProduct, type RawProduct } from "./reshape";

const GET_PRODUCT_QUERY = /* GraphQL */ `
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

export async function getProduct(
  handle: string,
  locale: string,
): Promise<Product | null> {
  const data = await storefrontFetch<{ product: RawProduct | null }>(
    GET_PRODUCT_QUERY,
    {
      variables: { handle },
      locale,
      tags: [TAGS.products, productTag(handle)],
    },
  );

  return data.product ? reshapeProduct(data.product) : null;
}
