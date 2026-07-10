import "server-only";
import { collectionTag, TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import { PRODUCT_CARD_FRAGMENT } from "@/core/shopify/fragments";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/core/shopify/types";
import {
  reshapeProductCard,
  type RawProductCard,
} from "@/domains/product/queries/reshape";
import type { CollectionWithProducts } from "../types";

const GET_COLLECTION_QUERY = /* GraphQL */ `
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

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
  products: Connection<RawProductCard>;
};

export async function getCollection(
  handle: string,
  locale: string,
  { first = 24 }: { first?: number } = {},
): Promise<CollectionWithProducts | null> {
  const data = await storefrontFetch<{ collection: RawCollection | null }>(
    GET_COLLECTION_QUERY,
    {
      variables: { handle, first },
      locale,
      // Products shown inside a collection change when products change too.
      tags: [TAGS.collections, collectionTag(handle), TAGS.products],
    },
  );

  if (!data.collection) return null;

  return {
    id: data.collection.id,
    handle: data.collection.handle,
    title: data.collection.title,
    description: data.collection.description,
    image: data.collection.image,
    seo: data.collection.seo,
    products: flattenConnection(data.collection.products).map(
      reshapeProductCard,
    ),
  };
}
