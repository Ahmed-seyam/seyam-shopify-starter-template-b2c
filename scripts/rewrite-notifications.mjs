/**
 * Rewrites Shopify email notification templates so their links land on this
 * headless storefront instead of the Online Store:
 *
 *   npm run rewrite-notifications -- https://my-store.vercel.app
 *   npm run rewrite-notifications -- https://my-store.vercel.app ./emails
 *
 * Shopify has no API for notification templates, so the round trip is manual:
 * paste each template's HTML (Settings → Notifications → <email> → Edit code)
 * into `<dir>/<name>.liquid` (default dir: ./notifications), run this script,
 * then paste `<dir>/out/<name>.liquid` back. Files in `out/` are ignored as
 * input, and re-running on an already-rewritten template is a no-op apart from
 * updating the storefront URL.
 *
 * What changes:
 *   - `{% assign storefront_url = "…" %}` is added (or updated) at the top.
 *   - href="{{ shop.url }}…" → href="{{ storefront_url }}…"
 *   - Password-reset links → {{ storefront_url }}/account/reset?reset_url=
 *     {{ customer.reset_password_url | url_encode }} (the app's
 *     customerResetByUrl flow). Handles both Shopify's default link and the
 *     old `reset_path` split workaround.
 * Links the app has no page for (account activation, order status, checkout,
 * unsubscribe…) are left alone; the script lists anything it could not map.
 */

import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const [storefrontArg, dirArg = "notifications"] = process.argv.slice(2);

let storefront;
try {
  storefront = new URL(storefrontArg);
  if (!/^https?:$/.test(storefront.protocol)) throw new Error();
} catch {
  console.error(
    "Usage: npm run rewrite-notifications -- <storefront-url> [templates-dir]\n" +
      "  e.g. npm run rewrite-notifications -- https://my-store.vercel.app",
  );
  process.exit(1);
}
const storefrontUrl = storefront.origin;

const RESET_HREF =
  "{{ storefront_url }}/account/reset?reset_url={{ customer.reset_password_url | url_encode }}";

// Liquid variables that point at Online Store pages this app does not serve.
const UNMAPPED = [
  "customer.account_activation_url",
  "shop.url",
];

function rewrite(source) {
  let out = source;

  // 1. storefront_url assign: update in place, or prepend.
  const assign = `{% assign storefront_url = "${storefrontUrl}" %}`;
  const assignRe = /\{%-?\s*assign\s+storefront_url\s*=\s*"[^"]*"\s*-?%\}/;
  out = assignRe.test(out) ? out.replace(assignRe, assign) : `${assign}\n${out}`;

  // 2. Drop the old `reset_path` split workaround; its href is replaced below.
  out = out.replace(
    /[ \t]*\{%-?\s*assign\s+reset_path\s*=\s*customer\.reset_password_url[^%]*%\}[ \t]*\r?\n?/g,
    "",
  );

  // 3. Any href built from the reset URL (default or split) → app reset page.
  out = out.replace(
    /href="[^"]*(?:reset_password_url|reset_path)[^"]*"/g,
    `href="${RESET_HREF}"`,
  );

  // 4. Links to the Online Store root / paths → storefront.
  out = out.replace(
    /href="\{\{-?\s*shop\.url\s*-?\}\}([^"]*)"/g,
    'href="{{ storefront_url }}$1"',
  );

  return out;
}

/** Remaining references to Online Store URLs, outside `{% if … %}` checks. */
function leftovers(source) {
  const found = new Set();
  for (const variable of UNMAPPED) {
    const re = new RegExp(`\\{\\{-?\\s*${variable.replace(".", "\\.")}\\b`, "g");
    if (re.test(source)) found.add(variable);
  }
  return [...found];
}

const inDir = path.resolve(dirArg);
const outDir = path.join(inDir, "out");

let files;
try {
  files = (await readdir(inDir)).filter((f) => /\.(liquid|html)$/i.test(f));
} catch {
  console.error(`No templates dir at ${inDir} — create it and paste templates in.`);
  process.exit(1);
}
if (files.length === 0) {
  console.error(`No .liquid/.html files in ${inDir}.`);
  process.exit(1);
}

await mkdir(outDir, { recursive: true });

for (const file of files.sort()) {
  const source = await readFile(path.join(inDir, file), "utf8");
  const result = rewrite(source);
  await writeFile(path.join(outDir, file), result);

  const hrefs = (result.match(/\{\{ storefront_url \}\}/g) ?? []).length;
  const warn = leftovers(result);
  console.log(
    `✓ ${file}: ${hrefs} link(s) → ${storefrontUrl}` +
      (warn.length ? `\n    left as-is: ${warn.join(", ")}` : ""),
  );
}

console.log(`\nPaste each file from ${outDir} back into its Shopify template.`);
