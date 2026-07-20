import type { Money, Seo, ShopifyImage } from "@/types/shopify";

export type ProductOption = {
  name: string;
  values: string[];
};

export type SelectedOption = {
  name: string;
  value: string;
};

export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: SelectedOption[];
  price: Money;
  compareAtPrice: Money | null;
};

/** Compact shape for grids/sliders — what listings and search return. */
export type ProductCard = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  minPrice: Money;
  maxPrice: Money;
  compareAtPrice: Money | null;
};

export type Product = ProductCard & {
  descriptionHtml: string;
  vendor: string;
  tags: string[];
  options: ProductOption[];
  images: ShopifyImage[];
  variants: ProductVariant[];
  seo: Seo;
};
