import "server-only";

// Infra only: raw→domain reshaping + domain types. Data fetching lives in the
// product domain's _actions (which call /api/product/*). lib never calls routes.
export { reshapeProduct, reshapeProductCard } from "./reshape";
export type { RawProduct, RawProductCard } from "./reshape";
export type * from "@/types/product";
