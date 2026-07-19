"use server";

import type { Product } from "../_types";
import { getProduct } from "./get-product";

/** Fetches full product data for the quick-add dialog. */
export async function quickViewProduct(
  handle: string,
  locale: string
): Promise<Product | null> {
  try {
    return await getProduct(handle, locale);
  } catch {
    return null;
  }
}
