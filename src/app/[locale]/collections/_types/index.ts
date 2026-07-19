import type { Seo, ShopifyImage } from "@/app/core/shopify/types";
// Type-only deep import: the barrel's ProductCard is the component.
import type { ProductCard } from "@/app/[locale]/products/_types";

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
