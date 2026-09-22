/**
 * Installs redirect-theme/ on a store so its Online Store (and every link in
 * Shopify's default emails — password reset, "Visit our store", …) lands on
 * this headless storefront. No email templates need editing.
 *
 *   npm run install-redirect-theme -- --store my-shop.myshopify.com --storefront https://my-shop.vercel.app
 *   npm run install-redirect-theme -- --store my-shop --storefront https://my-shop.vercel.app --publish
 *
 * Uses the Shopify CLI (via npx), which opens a browser login for the store
 * the first time. Without --publish the theme is uploaded unpublished so it can
 * be previewed; re-running updates the same "Headless redirect" theme.
 * Pass --password <theme-access-token> to skip the browser login (CI).
 */

import { spawnSync } from "node:child_process";
import { cp, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseArgs } from "node:util";

const THEME_NAME = "Headless redirect";
const THEME_DIR = path.resolve(import.meta.dirname, "../redirect-theme");

const { values: args } = parseArgs({
  options: {
    store: { type: "string" },
    storefront: { type: "string" },
    publish: { type: "boolean", default: false },
    password: { type: "string" },
  },
});

let storefront;
try {
  storefront = new URL(args.storefront ?? "");
  if (storefront.protocol !== "https:") throw new Error();
} catch {
  storefront = null;
}
if (!args.store || !storefront) {
  console.error(
    "Usage: npm run install-redirect-theme -- --store <shop>.myshopify.com --storefront https://<site> [--publish]",
  );
  process.exit(1);
}

const auth = ["--store", args.store, ...(args.password ? ["--password", args.password] : [])];

// npx is a .cmd on Windows, which Node only spawns through a shell — so
// arguments with spaces (the theme name, paths) must be quoted there.
const isWindows = process.platform === "win32";
const quote = (arg) => (isWindows && /[\s"&|<>^]/.test(arg) ? `"${arg.replace(/"/g, '""')}"` : arg);

/** Runs `shopify <args>`; with json: true, returns parsed stdout. */
function shopify(cliArgs, { json = false } = {}) {
  const result = spawnSync(
    "npx",
    ["-y", "@shopify/cli@latest", ...cliArgs, ...auth, ...(json ? ["--json"] : [])].map(quote),
    {
      stdio: ["inherit", json ? "pipe" : "inherit", "inherit"],
      encoding: "utf8",
      shell: isWindows,
    },
  );
  if (result.status !== 0) {
    console.error(`\nshopify ${cliArgs.join(" ")} failed.`);
    process.exit(result.status ?? 1);
  }
  if (!json) return null;
  // The CLI can print notices before the JSON payload.
  const start = result.stdout.search(/[[{]/);
  return JSON.parse(result.stdout.slice(start));
}

// Staging copy with the storefront URL baked into the theme settings.
const staging = await mkdtemp(path.join(tmpdir(), "redirect-theme-"));
try {
  await cp(THEME_DIR, staging, { recursive: true });
  await writeFile(
    path.join(staging, "config/settings_data.json"),
    JSON.stringify({ current: { storefront_url: storefront.origin } }, null, 2),
  );

  // Plain run first so a first-time browser login is visible to the user.
  console.log(`Themes on ${args.store}:`);
  shopify(["theme", "list"]);

  // `theme list --name` errors when nothing matches, so filter here instead.
  const themes = shopify(["theme", "list"], { json: true });
  const match = themes.find((t) => t.name === THEME_NAME) ?? null;

  const pushed = shopify(
    [
      "theme",
      "push",
      "--path",
      staging,
      ...(match ? ["--theme", String(match.id)] : ["--unpublished", "--theme", THEME_NAME]),
      ...(match?.role === "live" ? ["--allow-live"] : []),
    ],
    { json: true },
  );
  const theme = pushed.theme ?? pushed;
  console.log(`\n✓ "${THEME_NAME}" (#${theme.id}) → redirects to ${storefront.origin}`);
  if (theme.preview_url) console.log(`  Preview: ${theme.preview_url}`);

  if (args.publish && theme.role !== "live") {
    shopify(["theme", "publish", "--theme", String(theme.id), "--force"]);
    console.log("✓ Published — the Online Store now redirects to the storefront.");
  } else if (!args.publish) {
    console.log("  Not published. Re-run with --publish to make it live.");
  }
} finally {
  await rm(staging, { recursive: true, force: true });
}
