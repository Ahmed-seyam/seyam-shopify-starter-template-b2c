import "server-only";
import crypto from "node:crypto";

/**
 * Verifies a Shopify webhook signature (X-Shopify-Hmac-Sha256) against the
 * RAW request body. Must run before any JSON parsing — re-serialized JSON
 * will not match the signature. Timing-safe comparison.
 */
export function verifyWebhookHmac(
  rawBody: string,
  hmacHeader: string | null,
  secret: string,
): boolean {
  if (!hmacHeader) return false;

  const digest = crypto
    .createHmac("sha256", secret)
    .update(rawBody, "utf8")
    .digest("base64");

  const expected = Buffer.from(digest);
  const received = Buffer.from(hmacHeader);

  return (
    expected.length === received.length &&
    crypto.timingSafeEqual(expected, received)
  );
}
