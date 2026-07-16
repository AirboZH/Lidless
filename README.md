# Lidless

> Stay awake when locked · stay online

**English** · [简体中文](README.zh-CN.md)

[![License: MIT](https://img.shields.io/badge/License-MIT-6c8cff.svg)](LICENSE)

Keep your Mac (or Windows PC) **awake while the screen is locked**, so long-running
tasks, downloads and remote sessions keep going. The display can still turn off to
save power — the system stays up. One switch, that's it.

The name comes from the *lidless eye*: the machine looks asleep (locked), but the
unblinking eye stays open.

This is a **pnpm monorepo** with two packages — the desktop app and the website.

## Repository layout

```
.
├── apps/
│   ├── desktop/   # Tauri desktop app (macOS / Windows) that keeps the system awake while locked
│   └── web/       # Marketing site (Next.js + next-intl, bilingual)
├── packages/      # Reserved for future shared packages
├── pnpm-workspace.yaml
└── package.json   # Root workspace (script entry points)
```

## Requirements

- [Node.js](https://nodejs.org/) ≥ 20 and [pnpm](https://pnpm.io/) 10
- The desktop app also needs [Rust](https://rustup.rs/); on Windows it needs WebView2 (bundled with Windows 11)

```bash
pnpm install   # run at the repo root to install every workspace's dependencies
```

## Common commands

Root scripts just forward to the right package, so you don't have to `cd`:

| Command | What it does |
| --- | --- |
| `pnpm desktop:dev` | Run the desktop app in dev mode (`tauri dev`) |
| `pnpm desktop:build` | Build the desktop installers (`tauri build`) |
| `pnpm web:dev` | Start the site locally (defaults to http://localhost:3000) |
| `pnpm web:build` | Build the site (production) |
| `pnpm web:start` | Serve the production build |
| `pnpm web:lint` | Lint + type-check the site |

> You can also run `pnpm --filter @lidless/desktop <script>` or `pnpm --filter @lidless/web <script>` directly.

---

## apps/desktop — the desktop app

The Tauri keep-awake app. See [`apps/desktop/README.md`](apps/desktop/README.md) for
features, how it works, and the roadmap. After the move into the monorepo,
`tauri.conf.json`'s `frontendDist: "../src"` still resolves, so the dev/build flow is
unchanged.

---

## apps/web — the website

A marketing site built with Next.js (App Router) + Tailwind CSS v4 +
[next-intl](https://next-intl.dev/) (English + 简体中文).

### Local development

```bash
pnpm web:dev
# http://localhost:3000        → English (default locale, no prefix)
# http://localhost:3000/zh     → 简体中文
```

### Configuration (environment variables)

Copy `apps/web/.env.example` to `.env.local` and fill in what you need. Key entries:

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical origin used for canonical / hreflang / sitemap / OG |
| `NEXT_PUBLIC_DOWNLOAD_URL` | **The real download link for the "Download for macOS" CTA** (to be filled in) |
| `NEXT_PUBLIC_GITHUB_URL` | GitHub repository URL |
| `NEXT_PUBLIC_SANITY_*` | Sanity CMS (optional, see below) |
| `NEXT_PUBLIC_VIBELOFT_PRODUCT_ID` / `NEXT_PUBLIC_VIBELOFT_AUTH_KEY` | VibeLoft Web Telemetry for the hosted production site (optional). When either is unset — the default for forks, local dev and previews — no telemetry script is rendered |

> ⚠️ The download link currently falls back to GitHub Releases. Set
> `NEXT_PUBLIC_DOWNLOAD_URL` to your real `.dmg` / Release URL.

### SEO

The site ships with a full SEO setup:

- **Internationalization** — `/` (en) and `/zh`, with auto-generated `hreflang` + `x-default` + canonical
- **Structured data (JSON-LD)** — `SoftwareApplication`, `FAQPage`, `WebSite`
- **Dynamic OG images** — generated per locale with `next/og` (`/opengraph-image`, `/zh/opengraph-image`)
- `sitemap.xml`, `robots.txt`, `manifest.webmanifest`, and the favicon are all generated automatically
- Semantic markup, the `lang` attribute, skip-to-content, and `prefers-reduced-motion`

Entry points: SEO helpers in [`apps/web/src/lib/seo.ts`](apps/web/src/lib/seo.ts) and
metadata in [`apps/web/src/app/[locale]/layout.tsx`](apps/web/src/app/[locale]/layout.tsx).

### Headless CMS (Sanity) — integration point already in place

The content for the "Use cases" section goes through an abstraction layer at
[`apps/web/src/lib/cms`](apps/web/src/lib/cms):

- **Sanity not configured** → it uses local demo data
  ([`demo-data.ts`](apps/web/src/lib/cms/demo-data.ts), including the Claude Code
  remote-coding scenarios), so the site still builds and runs.
- **Sanity configured** (set `NEXT_PUBLIC_SANITY_PROJECT_ID`) → it switches to a GROQ
  query ([`queries.ts`](apps/web/src/lib/cms/queries.ts)); if the query is empty or
  fails, it still falls back to demo data so the page always has content.

To wire it up:

1. Create a Sanity project, grab its `projectId`, and put it in `.env.local`
2. Add the `useCase` schema from
   [`apps/web/sanity/schema.example.ts`](apps/web/sanity/schema.example.ts) to your Sanity Studio
3. For multiple languages, use the document-level i18n plugin
   (`@sanity/document-internationalization`, which adds a `language` field that lines up with the query)
4. Publish a few `useCase` entries — the site switches from demo data to CMS content automatically

The content shape is defined in
[`apps/web/src/lib/cms/types.ts`](apps/web/src/lib/cms/types.ts); keep it consistent
with the schema and the query.

### Deploy

Any platform that supports Next.js (Vercel / Node). Remember to set the environment
variables above, especially `NEXT_PUBLIC_SITE_URL` and `NEXT_PUBLIC_DOWNLOAD_URL`.

---

## Contributing

Issues and pull requests are welcome. For a code change, please make sure
`pnpm web:lint` passes (for the site) and the desktop app builds.

## License

[MIT](LICENSE) © AirboZH
