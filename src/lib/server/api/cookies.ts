import "server-only";
import { cookies } from "next/headers";

/**
 * Cookie plumbing for the internal /api HTTP layer.
 *
 * When a Server Action or Server Component calls one of our own Route Handlers
 * via `fetch()`, any `Set-Cookie` the handler emits (session id, customer JWE)
 * does NOT reach the browser on its own — the browser never saw that response.
 * `applySetCookies` re-applies those cookies onto the CURRENT request's cookie
 * store, which Next then flushes to the browser. This is what keeps
 * `persistSession` / `saveCustomerToken` working across the HTTP boundary.
 *
 * Best-effort: cookie writes during RSC render are forbidden by Next (same
 * read-only guard as core/shopify/session), so we swallow that and let the next
 * Server Action persist.
 */

type CookieOptions = {
  path?: string;
  maxAge?: number;
  domain?: string;
  sameSite?: "lax" | "strict" | "none";
  secure?: boolean;
  httpOnly?: boolean;
  expires?: Date;
};

type ParsedCookie = {
  name: string;
  value: string;
  options: CookieOptions;
};

function parseSetCookie(raw: string): ParsedCookie | null {
  const [pair, ...attributes] = raw.split(";").map((part) => part.trim());
  const eq = pair.indexOf("=");
  if (eq === -1) return null;

  const name = pair.slice(0, eq);
  const value = pair.slice(eq + 1);
  const options: CookieOptions = {};

  for (const attribute of attributes) {
    const separator = attribute.indexOf("=");
    const key = (
      separator === -1 ? attribute : attribute.slice(0, separator)
    ).toLowerCase();
    const attrValue = separator === -1 ? "" : attribute.slice(separator + 1);

    switch (key) {
      case "path":
        options.path = attrValue;
        break;
      case "domain":
        options.domain = attrValue;
        break;
      case "max-age":
        options.maxAge = Number(attrValue);
        break;
      case "expires":
        options.expires = new Date(attrValue);
        break;
      case "samesite": {
        const lower = attrValue.toLowerCase();
        if (lower === "lax" || lower === "strict" || lower === "none") {
          options.sameSite = lower;
        }
        break;
      }
      case "secure":
        options.secure = true;
        break;
      case "httponly":
        options.httpOnly = true;
        break;
    }
  }

  return { name, value, options };
}

export async function applySetCookies(response: Response): Promise<void> {
  const setCookies = response.headers.getSetCookie?.() ?? [];
  if (setCookies.length === 0) return;

  let store: Awaited<ReturnType<typeof cookies>>;
  try {
    store = await cookies();
  } catch {
    return; // read-only cookie context — skip silently
  }

  for (const raw of setCookies) {
    const parsed = parseSetCookie(raw);
    if (!parsed) continue;

    try {
      // Max-Age=0 (or an empty value) is a deletion the upstream requested,
      // e.g. clearSession / clearCustomerToken on logout.
      if (parsed.options.maxAge === 0 || parsed.value === "") {
        store.delete(parsed.name);
      } else {
        store.set(parsed.name, parsed.value, parsed.options);
      }
    } catch {
      // read-only cookie context (RSC render / cached scope) — skip silently.
    }
  }
}
