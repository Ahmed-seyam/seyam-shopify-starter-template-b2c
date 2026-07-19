import { NextResponse } from "next/server";
import { getCart } from "@/app/[locale]/cart";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const cart = await getCart(routing.defaultLocale);
    return NextResponse.json({ count: cart?.totalQuantity ?? 0 });
  } catch {
    return NextResponse.json({ count: 0 });
  }
}
