import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // The site is a purely static marketing page, so enable more aggressive image optimization and compression
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // The monorepo root (two levels above apps/web). Prevents Next from mistaking a higher-up directory for the workspace root.
  outputFileTracingRoot: path.join(__dirname, "../../"),
  // Next's sitemap.ts route emits `application/xml` without a charset. Declare
  // utf-8 explicitly so the HTTP header agrees with the XML prolog's encoding.
  async headers() {
    return [
      {
        source: "/sitemap.xml",
        headers: [
          { key: "Content-Type", value: "application/xml; charset=utf-8" },
        ],
      },
    ];
  },
};

export default withNextIntl(nextConfig);
