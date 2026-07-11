import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_FLOW_COOKIE,
  buildAuthorizationRequest,
  customerAuthConfig,
} from "@/core/shopify/customer-auth";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = customerAuthConfig();
  const locale =
    request.nextUrl.searchParams.get("locale") ?? routing.defaultLocale;

  if (!config) {
    // Accounts not configured — the account page explains it.
    return NextResponse.redirect(new URL(`/${locale}/account`, request.url));
  }

  const { url, state, verifier } = await buildAuthorizationRequest(config);

  const response = NextResponse.redirect(url);
  response.cookies.set(
    AUTH_FLOW_COOKIE,
    JSON.stringify({ state, verifier, locale }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 600,
    },
  );
  return response;
}
