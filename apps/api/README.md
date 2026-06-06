# @lidless/update-api

The desktop app's **auto-update service**: [Hono](https://hono.dev) on **Cloudflare Workers**, reading the "latest release manifest" from **Workers KV** and answering the app's update checks per the [Tauri updater](https://v2.tauri.app/plugin/updater/) protocol.

**Decoupled** from the marketing site (`apps/web`): deployed independently, so a site redeploy or outage never affects update checks.

## Why it's safe to open-source

The service only serves **public metadata** (version + installer URL + signature). Real security comes from the **minisign public key** embedded in the app, which verifies the downloaded installer — even a fully compromised endpoint cannot push a malicious update (it can't forge a valid signature).

> The only secret in the whole system is the minisign **private key**, kept in GitHub Actions secrets and used only when signing during packaging. It never enters this repo or this service.

## Endpoint

```
GET /update/{{target}}/{{arch}}/{{current_version}}
```

- `target`: `darwin` | `windows` | `linux`
- `arch`: `x86_64` | `aarch64` | …
- **204**: up to date / no build for this platform / nothing released yet
- **200 + JSON**: an update is available (Tauri single-platform format `{ version, pub_date, notes, url, signature }`)

App side, in `apps/desktop/src-tauri/tauri.conf.json`:

```jsonc
"plugins": {
  "updater": {
    "endpoints": ["https://api.lidless.app/update/{{target}}/{{arch}}/{{current_version}}"],
    "pubkey": "<minisign public key>"
  }
}
```

## Where the data comes from (KV)

The Worker reads the JSON stored under the KV key `release:latest` (shape: `ReleaseManifest` in `src/index.ts`, matching tauri-action's `latest.json`).

The release pipeline writes that key after building + signing. Manual write example:

```bash
pnpm api exec wrangler kv key put --binding=UPDATES release:latest --path=latest.json
```

## Local development

```bash
# 1) Install deps (from the repo root)
pnpm install

# 2) KV namespaces are already created; their ids live in wrangler.jsonc

# 3) Run locally
pnpm api:dev
# Visit http://localhost:8787/  and  /update/darwin/aarch64/0.0.1
```

## Deploy

```bash
# First time: log in to Cloudflare
pnpm api exec wrangler login

# Deploy
pnpm api:deploy
```

GitHub secrets used by CI (in the release workflows):

| Secret | Purpose |
| --- | --- |
| `CLOUDFLARE_API_TOKEN` | Deploy the Worker + write KV (perms: Workers Scripts:Edit, Workers KV Storage:Edit) |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare account id |

> Public domain is `api.lidless.app` (see `routes` in `wrangler.jsonc`; created on deploy; requires lidless.app on Cloudflare DNS).
