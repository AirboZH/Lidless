import { Hono } from "hono";

/**
 * Lidless auto-update service (Hono on Cloudflare Workers).
 *
 * Data flow:
 *   GitHub Actions release -> tauri-action produces signatures + latest.json
 *   -> CI writes latest.json into KV (key = RELEASE_KEY)
 *   -> this Worker reads KV and answers the app per the Tauri updater protocol.
 *
 * Security model: the Worker only serves PUBLIC metadata (version + download URL
 * + signature). Trust comes from the minisign public key embedded in the app,
 * which verifies the downloaded installer. Even a fully compromised endpoint
 * cannot push a malicious update (it cannot forge a valid signature), so this
 * service holds no secrets and is safe to open-source.
 */

type Bindings = {
  UPDATES: KVNamespace;
};

/** Release manifest stored in KV; shape matches tauri-action's latest.json. */
interface ReleaseManifest {
  version: string;
  /** ISO8601, e.g. 2026-06-01T10:00:00Z */
  pub_date?: string;
  notes?: string;
  /** keys look like "darwin-aarch64" / "windows-x86_64" */
  platforms: Record<string, { url: string; signature: string }>;
}

/** KV key holding the latest release manifest. CI writes this on each release. */
const RELEASE_KEY = "release:latest";

const app = new Hono<{ Bindings: Bindings }>();

// Health check / liveness
app.get("/", (c) =>
  c.json({ name: "lidless-update", ok: true, endpoint: "/update/:target/:arch/:version" }),
);

/**
 * Tauri updater endpoint.
 * App-side endpoint config:
 *   https://<worker-host>/update/{{target}}/{{arch}}/{{current_version}}
 *
 * Responses:
 *   - 204 No Content: up to date / no build for this platform / nothing released yet
 *   - 200 + JSON: an update is available (Tauri's single-platform update format)
 */
app.get("/update/:target/:arch/:version", async (c) => {
  const target = c.req.param("target"); // darwin | windows | linux
  const arch = c.req.param("arch"); // x86_64 | aarch64 | ...
  const current = c.req.param("version"); // the app's current version, e.g. 0.1.0

  const manifest = await c.env.UPDATES.get<ReleaseManifest>(RELEASE_KEY, "json");
  if (!manifest) return c.body(null, 204); // nothing released yet

  const platform = manifest.platforms?.[`${target}-${arch}`];
  if (!platform) return c.body(null, 204); // no artifact for this platform/arch

  // Only offer an update when the released version is strictly newer.
  if (compareSemver(manifest.version, current) <= 0) return c.body(null, 204);

  return c.json({
    version: manifest.version,
    pub_date: manifest.pub_date,
    notes: manifest.notes ?? "",
    url: platform.url,
    signature: platform.signature,
  });
});

export default app;

/**
 * Minimal semver compare: returns >0 if a is newer than b, <0 if older, 0 if equal.
 * Handles a leading "v" and a "-prerelease" suffix; a release outranks a prerelease
 * of the same core version. Good enough for release tags (x.y.z / x.y.z-beta.1)
 * without pulling in a dependency.
 */
function compareSemver(a: string, b: string): number {
  const parse = (raw: string) => {
    const v = raw.replace(/^v/, "");
    const dash = v.indexOf("-");
    const core = dash === -1 ? v : v.slice(0, dash);
    const pre = dash === -1 ? "" : v.slice(dash + 1);
    const nums = core.split(".").map((n) => parseInt(n, 10) || 0);
    return { nums, pre };
  };

  const pa = parse(a);
  const pb = parse(b);

  for (let i = 0; i < 3; i++) {
    const diff = (pa.nums[i] ?? 0) - (pb.nums[i] ?? 0);
    if (diff !== 0) return diff > 0 ? 1 : -1;
  }

  // Same core version: the one without a prerelease suffix is newer
  if (!pa.pre && pb.pre) return 1;
  if (pa.pre && !pb.pre) return -1;
  if (pa.pre && pb.pre) {
    if (pa.pre > pb.pre) return 1;
    if (pa.pre < pb.pre) return -1;
  }
  return 0;
}
