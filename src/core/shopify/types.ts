// Shared Shopify scalar shapes used by the anti-corruption mappings in
// each domain's queries/ folder. Domain types live in domains/*/types.

export type Money = {
  amount: string;
  currencyCode: string;
};

export type ShopifyImage = {
  url: string;
  altText: string | null;
  width: number;
  height: number;
};

export type Seo = {
  title: string | null;
  description: string | null;
};

export type Edge<T> = { node: T };

export type Connection<T> = {
  edges: Edge<T>[];
  pageInfo?: {
    hasNextPage: boolean;
    hasPreviousPage: boolean;
    startCursor: string | null;
    endCursor: string | null;
  };
};

export function flattenConnection<T>(connection: Connection<T>): T[] {
  return connection.edges.map((edge) => edge.node);
}

/**
 * App language code → Storefront API LanguageCode enum value.
 * Shopify's enum is the uppercased ISO code with "_" for regions
 * (en → EN, ar → AR, pt-BR → PT_BR), so no lookup table is needed.
 */
export function toShopifyLanguage(language: string): string {
  return language.toUpperCase().replace(/-/g, "_");
}
