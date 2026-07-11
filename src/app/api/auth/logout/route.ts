import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/core/config/env";
import {
  clearCustomerTokens,
  customerAuthConfig,
  loadCustomerTokens,
} from "@/core/shopify/customer-auth";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = customerAuthConfig();
  const locale =
    request.nextUrl.searchParams.get("locale") ?? routing.defaultLocale;

  const tokens = await loadCustomerTokens();
  await clearCustomerTokens();

  // End the Shopify-side session too, then bounce back to the storefront.
  // Redirect target is the bare SITE_URL: Shopify exact-matches it against
  // the client's Logout URI allow-list, and the locale middleware restores
  // the visitor's locale from the NEXT_LOCALE cookie anyway.
  if (config && tokens?.idToken) {
    const url = new URL(config.logoutUrl);
    url.searchParams.set("id_token_hint", tokens.idToken);
    url.searchParams.set("post_logout_redirect_uri", env().SITE_URL);
    return NextResponse.redirect(url);
  }

  return NextResponse.redirect(new URL(`/${locale}`, request.url));
}
