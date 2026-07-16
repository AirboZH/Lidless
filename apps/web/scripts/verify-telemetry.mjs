/**
 * Verifies the VibeLoft Web Telemetry integration in the production build
 * output (run after `next build`).
 *
 * - With NEXT_PUBLIC_VIBELOFT_PRODUCT_ID + NEXT_PUBLIC_VIBELOFT_AUTH_KEY set:
 *   every statically generated HTML document must contain EXACTLY ONE
 *   telemetry script tag (official runtime URL + both data attributes).
 * - Without them (forks / local / preview builds): telemetry must be
 *   completely absent from the output.
 * - In both modes: no Supabase endpoint may appear anywhere in the build.
 *
 * Usage: node scripts/verify-telemetry.mjs   (cwd = apps/web, after build)
 */
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

const SCRIPT_URL = "https://vibeloft.ai/telemetry/v1.js";
const productId = process.env.NEXT_PUBLIC_VIBELOFT_PRODUCT_ID ?? "";
const authKey = process.env.NEXT_PUBLIC_VIBELOFT_AUTH_KEY ?? "";
const enabled = Boolean(productId && authKey);

const appDir = join(process.cwd(), ".next", "server", "app");
const staticDir = join(process.cwd(), ".next", "static");

function walk(dir, ext, out = []) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, ext, out);
    else if (name.endsWith(ext)) out.push(p);
  }
  return out;
}

function count(haystack, needle) {
  return haystack.split(needle).length - 1;
}

const errors = [];
const htmlFiles = walk(appDir, ".html");
if (htmlFiles.length === 0) {
  console.error("No prerendered HTML found — run `next build` first.");
  process.exit(1);
}

for (const file of htmlFiles) {
  const html = readFileSync(file, "utf8");
  // Count only real rendered attributes (unescaped quotes). The RSC flight
  // payload also serializes the element as JSON (\"src\":\"...\"), which is
  // data, not a second DOM node — so it must not count as an initialization.
  const scripts = count(html, `src="${SCRIPT_URL}"`);
  const ids = count(html, 'data-vl-product-id="');
  const keys = count(html, 'data-vl-auth-key="');
  // app/_not-found is the bare fallback 404 outside the [locale] layout — it
  // is not a normal page and carries no telemetry.
  const expected = enabled && !file.endsWith("_not-found.html") ? 1 : 0;
  if (scripts !== expected || ids !== expected || keys !== expected) {
    errors.push(
      `${file}: expected ${expected} telemetry init, found script=${scripts} product-id=${ids} auth-key=${keys}`,
    );
    continue;
  }
  if (expected === 1 && !html.includes(`data-vl-product-id="${productId}"`)) {
    errors.push(`${file}: telemetry script present but product id mismatch`);
  }
}

// The official runtime is the only collector — no Supabase endpoint may ship.
for (const file of [...htmlFiles, ...walk(staticDir, ".js")]) {
  if (readFileSync(file, "utf8").toLowerCase().includes("supabase")) {
    errors.push(`${file}: unexpected Supabase reference in build output`);
  }
}

if (errors.length > 0) {
  console.error("Telemetry verification FAILED:");
  for (const e of errors) console.error("  - " + e);
  process.exit(1);
}
console.log(
  `Telemetry verification OK — ${htmlFiles.length} documents checked, mode=${
    enabled ? "enabled (exactly one init per document)" : "disabled (absent)"
  }, no Supabase references.`,
);
