import createProxy from "next-intl/middleware";
import { routing } from "./i18n/routing";

// next-intl handles locale detection, redirects and rewrites.
// Extend here later for: security headers, locked-storefront gating (B2B fork).
export default createProxy(routing);

export const config = {
  // Skip API routes, Next internals and static files.
  matcher: "/((?!api|_next|_vercel|.*\\..*).*)",
};
