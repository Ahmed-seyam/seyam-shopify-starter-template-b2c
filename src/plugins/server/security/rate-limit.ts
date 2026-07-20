import "server-only";

/**
 * Fixed-window in-memory rate limiter. Good enough to blunt scrapers and
 * runaway clients on a single instance; swap `check` for a Redis/Upstash
 * implementation if you deploy across many serverless instances and need a
 * shared budget (each instance gets its own window here).
 */

type Window = { count: number; resetAt: number };

const windows = new Map<string, Window>();
const MAX_ENTRIES = 10_000;

export type RateLimitResult = {
  ok: boolean;
  /** Seconds until the window resets — for the Retry-After header. */
  retryAfter: number;
};

export function checkRateLimit(
  key: string,
  { limit, windowMs }: { limit: number; windowMs: number },
): RateLimitResult {
  const now = Date.now();

  const current = windows.get(key);
  if (!current || current.resetAt <= now) {
    if (windows.size >= MAX_ENTRIES) evictExpired(now);
    windows.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, retryAfter: 0 };
  }

  current.count += 1;
  if (current.count > limit) {
    return {
      ok: false,
      retryAfter: Math.ceil((current.resetAt - now) / 1000),
    };
  }
  return { ok: true, retryAfter: 0 };
}

function evictExpired(now: number) {
  for (const [key, window] of windows) {
    if (window.resetAt <= now) windows.delete(key);
  }
  // Still full of live windows (an actual flood): drop the oldest entries
  // rather than letting the map grow without bound.
  if (windows.size >= MAX_ENTRIES) {
    for (const key of windows.keys()) {
      if (windows.size < MAX_ENTRIES / 2) break;
      windows.delete(key);
    }
  }
}

/** Client IP from proxy headers (Vercel/CDN sets x-forwarded-for). */
export function clientIp(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "unknown"
  );
}
