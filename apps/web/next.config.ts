import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 官网为纯静态营销页，开启更激进的图片优化与压缩
  poweredByHeader: false,
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // monorepo 根（apps/web 的上两级）。避免 Next 误把上层目录当 workspace root。
  outputFileTracingRoot: path.join(__dirname, "../../"),
};

export default withNextIntl(nextConfig);
