"use server";

import type { Cart } from "../types";
import { getCart } from "./get-cart";

/** Client-callable cart read (the drawer fetches on open). */
export async function fetchCart(locale: string): Promise<Cart | null> {
  try {
    return await getCart(locale);
  } catch {
    return null;
  }
}
