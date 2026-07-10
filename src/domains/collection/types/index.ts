import type { Seo, ShopifyImage } from "@/core/shopify/types";
// Type-only deep import: the barrel's ProductCard is the component.
import type { ProductCard } from "@/domains/product/types";

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  image: ShopifyImage | null;
  seo: Seo;
};

export type CollectionWithProducts = Collection & {
  products: ProductCard[];
};
