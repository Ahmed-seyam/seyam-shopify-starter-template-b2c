import { NextResponse, type NextRequest } from "next/server";
import {
  AUTH_FLOW_COOKIE,
  customerAuthConfig,
  exchangeCodeForTokens,
  saveCustomerTokens,
} from "@/core/shopify/customer-auth";
import { routing } from "@/i18n/routing";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const config = customerAuthConfig();
  const flowCookie = request.cookies.get(AUTH_FLOW_COOKIE)?.value;

  let flow: { state: string; verifier: string; locale: string } | null = null;
  try {
    flow = flowCookie ? JSON.parse(flowCookie) : null;
  } catch {
    flow = null;
  }
  const locale = flow?.locale ?? routing.defaultLocale;

  const fail = () => {
    const response = NextResponse.redirect(
      new URL(`/${locale}/account?error=auth`, request.url),
    );
    response.cookies.delete(AUTH_FLOW_COOKIE);
    return response;
  };

  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");
  // State must round-trip exactly — CSRF protection for the OAuth flow.
  if (!config || !flow || !code || !state || state !== flow.state) {
    return fail();
  }

  try {
    const tokens = await exchangeCodeForTokens(config, code, flow.verifier);
    await saveCustomerTokens(tokens);
  } catch (error) {
    console.warn("[auth] token exchange failed", error);
    return fail();
  }

  const response = NextResponse.redirect(
    new URL(`/${locale}/account`, request.url),
  );
  response.cookies.delete(AUTH_FLOW_COOKIE);
  return response;
}
