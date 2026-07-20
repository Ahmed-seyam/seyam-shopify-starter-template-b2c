import "server-only";
import { NextResponse } from "next/server";
import {
  ShopifyError,
  ShopifyUserError,
  type UserError,
} from "@/plugins/server/shopify/client";

/**
 * Shared response contract for the internal /api layer.
 *
 * Every Route Handler returns a `{ data }` envelope on success or an `{ error }`
 * envelope on failure. `callApi` (lib/api/http) revives the error envelope back
 * into the SAME `ShopifyError` / `ShopifyUserError` instances, so call sites
 * that `catch (e instanceof ShopifyUserError)` keep working across the HTTP hop.
 */

export type ApiErrorBody =
  | { kind: "user"; operation: string; userErrors: UserError[] }
  | { kind: "shopify"; message: string; status: number }
  | { kind: "generic"; message: string };

export type ApiEnvelope<T> = { data: T } | { error: ApiErrorBody };

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ data } satisfies ApiEnvelope<T>, init);
}

export function fail(error: unknown): NextResponse {
  if (error instanceof ShopifyUserError) {
    // 422: the request was well-formed but Shopify rejected it on business
    // rules (userErrors). Revived client-side as ShopifyUserError.
    return NextResponse.json(
      {
        error: {
          kind: "user",
          operation: error.operation,
          userErrors: error.userErrors,
        },
      } satisfies ApiEnvelope<never>,
      { status: 422 },
    );
  }

  if (error instanceof ShopifyError) {
    const status = error.status >= 400 && error.status < 600 ? error.status : 502;
    return NextResponse.json(
      { error: { kind: "shopify", message: error.message, status: error.status } } satisfies ApiEnvelope<never>,
      { status },
    );
  }

  // Never leak internals — a generic message only.
  const message = error instanceof Error ? error.message : "Unexpected error";
  return NextResponse.json(
    { error: { kind: "generic", message } } satisfies ApiEnvelope<never>,
    { status: 500 },
  );
}

/**
 * Wraps a Route Handler so any thrown error becomes the `{ error }` envelope.
 * Handlers stay focused on the happy path + `ok(...)`.
 */
export function route(
  handler: (request: Request) => Promise<NextResponse>,
): (request: Request) => Promise<NextResponse> {
  return async (request) => {
    try {
      return await handler(request);
    } catch (error) {
      return fail(error);
    }
  };
}
