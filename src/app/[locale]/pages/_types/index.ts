import type { Seo } from "@/lib/shopify/types";

export type Page = {
  id: string;
  handle: string;
  title: string;
  /** Sanitized HTML from Shopify's rich-text editor. */
  body: string;
  bodySummary: string;
  seo: Seo | null;
  updatedAt: string;
};

export type MetaobjectField = {
  key: string;
  value: string | null;
  type: string;
};

export type Metaobject = {
  id: string;
  handle: string;
  type: string;
  updatedAt: string;
  /** Keyed by field key for ergonomic access: fields.hero_title */
  fields: Record<string, MetaobjectField>;
};
