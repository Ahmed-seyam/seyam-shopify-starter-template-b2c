import type { ZodError } from "zod";

/**
 * The distinct top-level field names that failed validation — one entry per
 * field, in first-seen order. Lets a form show a single translated message
 * under each input (the message itself stays i18n-owned by the caller, so raw
 * zod strings never reach the UI).
 */
export function erroredFields(error: ZodError): string[] {
  const seen: string[] = [];
  for (const issue of error.issues) {
    const key = issue.path[0];
    if (typeof key === "string" && !seen.includes(key)) seen.push(key);
  }
  return seen;
}
