import "server-only";
import { TAGS } from "@/core/cache/tags";
import { storefrontFetch } from "@/core/shopify/client";
import {
  flattenConnection,
  type Connection,
  type Seo,
  type ShopifyImage,
} from "@/core/shopify/types";
import type { Collection } from "../types";

const GET_COLLECTIONS_QUERY = /* GraphQL */ `
  query getCollections(
    $first: Int!
    $country: CountryCode
    $language: LanguageCode
  ) @inContext(country: $country, language: $language) {
    collections(first: $first, sortKey: TITLE) {
      edges {
        node {
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
        }
      }
    }
  }
`;

type RawCollection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
};

export async function getCollections(
  locale: string,
  { first = 12 }: { first?: number } = {},
): Promise<Collection[]> {
  const data = await storefrontFetch<{
    collections: Connection<RawCollection>;
  }>(GET_COLLECTIONS_QUERY, {
    variables: { first },
    locale,
    tags: [TAGS.collections],
  });

  return flattenConnection(data.collections);
}
