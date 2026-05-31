/**
 * 站点级配置集中在这里，便于一处修改。
 * 凡是「待你填真实值」的项都走环境变量，并给了占位默认值，构建不会因为缺值而失败。
 */

// 站点规范域名（用于 canonical / hreflang / sitemap / OG）。部署时设 NEXT_PUBLIC_SITE_URL。
export const siteUrl = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://lidless.cc"
).replace(/\/$/, "");

// 主 CTA「Download for macOS」指向的真实下载链接（.dmg / Release 页）。
// TODO: 部署前把 NEXT_PUBLIC_DOWNLOAD_URL 设成真实链接。
export const downloadUrl =
  process.env.NEXT_PUBLIC_DOWNLOAD_URL ??
  "https://github.com/AirboZH/Lidless/releases/latest";

// GitHub 仓库地址（副 CTA / 页脚）。
export const githubUrl =
  process.env.NEXT_PUBLIC_GITHUB_URL ?? "https://github.com/AirboZH/Lidless";

export const siteConfig = {
  name: "Lidless",
  url: siteUrl,
  downloadUrl,
  githubUrl,
  // 当前发布的版本与系统要求（展示在下载按钮附近）
  appVersion: "0.1.0",
  minMacOS: "12.0",
  // 社交 / 联系（OG、JSON-LD 用）
  twitter: process.env.NEXT_PUBLIC_TWITTER ?? "",
  email: "hi@lidless.cc",
} as const;

export type SiteConfig = typeof siteConfig;
