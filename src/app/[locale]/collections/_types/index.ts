import type { Seo, ShopifyImage } from "@/types/shopify";
// Type-only deep import: the barrel's ProductCard is the component.
import type { ProductCard } from "@/types/product";

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
