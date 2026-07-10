import "server-only";
import { z } from "zod";

const envSchema = z.object({
  SHOPIFY_STORE_DOMAIN: z
    .string()
    .min(1, "SHOPIFY_STORE_DOMAIN is required, e.g. your-store.myshopify.com")
    .regex(/^[^/]+$/, "Domain only — no protocol or path"),
  SHOPIFY_STOREFRONT_TOKEN: z.string().min(1),
  SHOPIFY_ADMIN_TOKEN: z.string().optional(),
  SHOPIFY_API_VERSION: z.string().default("2025-07"),
  SHOPIFY_WEBHOOK_SECRET: z.string().optional(),
  SHOPIFY_DEFAULT_COUNTRY: z.string().length(2).default("EG"),
  SITE_URL: z.url().default("http://localhost:3000"),
  REVALIDATION_SECRET: z.string().optional(),
  SEARCH_PROVIDER: z.enum(["shopify", "algolia"]).default("shopify"),
  ALGOLIA_APP_ID: z.string().optional(),
  ALGOLIA_SEARCH_API_KEY: z.string().optional(),
  ALGOLIA_ADMIN_API_KEY: z.string().optional(),
  ALGOLIA_INDEX: z.string().default("products"),
});

// Validated lazily so `next build` works without a configured store
// (store-independent Docker images — pages materialize via ISR on first hit).
let cached: z.infer<typeof envSchema> | undefined;

export function env() {
  cached ??= envSchema.parse(process.env);
  return cached;
}
