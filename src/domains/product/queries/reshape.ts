import "server-only";
import type {
  Connection,
  Money,
  Seo,
  ShopifyImage,
} from "@/core/shopify/types";
import { flattenConnection } from "@/core/shopify/types";
import type { Product, ProductCard, ProductVariant } from "../types";

// Anti-corruption layer: raw Storefront API shapes stop here.
// Components only ever see the domain types from ../types.

export type RawProductCard = {
  id: string;
  handle: string;
  title: string;
  availableForSale: boolean;
  featuredImage: ShopifyImage | null;
  priceRange: {
    minVariantPrice: Money;
    maxVariantPrice: Money;
  };
  compareAtPriceRange: {
    maxVariantPrice: Money;
  };
};

export type RawProduct = RawProductCard & {
  descriptionHtml: string;
  vendor: string;
  tags: string[];
  options: Array<{ name: string; optionValues: Array<{ name: string }> }>;
  images: Connection<ShopifyImage>;
  variants: Connection<{
    id: string;
    title: string;
    availableForSale: boolean;
    selectedOptions: Array<{ name: string; value: string }>;
    price: Money;
    compareAtPrice: Money | null;
  }>;
  seo: Seo;
};

export function reshapeProductCard(raw: RawProductCard): ProductCard {
  const compareAt = raw.compareAtPriceRange.maxVariantPrice;
  return {
    id: raw.id,
    handle: raw.handle,
    title: raw.title,
    availableForSale: raw.availableForSale,
    featuredImage: raw.featuredImage,
    minPrice: raw.priceRange.minVariantPrice,
    maxPrice: raw.priceRange.maxVariantPrice,
    compareAtPrice: Number(compareAt?.amount) > 0 ? compareAt : null,
  };
}

export function reshapeProduct(raw: RawProduct): Product {
  const variants: ProductVariant[] = flattenConnection(raw.variants).map(
    (variant) => ({
      id: variant.id,
      title: variant.title,
      availableForSale: variant.availableForSale,
      selectedOptions: variant.selectedOptions,
      price: variant.price,
      compareAtPrice: variant.compareAtPrice,
    }),
  );

  return {
    ...reshapeProductCard(raw),
    descriptionHtml: raw.descriptionHtml,
    vendor: raw.vendor,
    tags: raw.tags,
    options: raw.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    images: flattenConnection(raw.images),
    variants,
    seo: raw.seo,
  };
}
