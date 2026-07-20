/**
 * Storefront-scoped utilities — helpers used across the `[locale]` route tree
 * (pages, components, actions). Keep infra-free, isomorphic helpers here; the
 * API tree has its own `app/api/_utils`.
 */
export { safeLocale } from "./locale";
export { erroredFields } from "./form";
