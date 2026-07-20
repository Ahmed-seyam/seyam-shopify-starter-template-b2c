import "server-only";

/**
 * Parse a JSON request body without ever throwing — a malformed or empty body
 * yields `null` so route handlers can fall straight into schema validation
 * (`schema.safeParse(await readJson(request))`) instead of a try/catch.
 */
export async function readJson<T = unknown>(request: Request): Promise<T | null> {
  return request.json().catch(() => null) as Promise<T | null>;
}
