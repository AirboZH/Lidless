import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { siteConfig, siteUrl } from "@/config/site";

/** 把 (语言, 路径) 拼成绝对 URL，遵循 localePrefix: "as-needed"（默认语言无前缀）*/
export function localizedUrl(locale: Locale, path = "/"): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `${siteUrl}${prefix}${clean}` || siteUrl;
}

/**
 * canonical + hreflang。每个页面都应该给出：
 *  - canonical 指向当前语言版本
 *  - languages 列出所有语言版本 + x-default
 */
export function buildAlternates(
  locale: Locale,
  path = "/",
): NonNullable<Metadata["alternates"]> {
  const languages: Record<string, string> = {};
  for (const loc of locales) {
    languages[loc] = localizedUrl(loc, path);
  }
  languages["x-default"] = localizedUrl(defaultLocale, path);

  return {
    canonical: localizedUrl(locale, path),
    languages,
  };
}

/** SoftwareApplication 结构化数据 —— 帮助 Google 把 Lidless 识别成一款可下载软件 */
export function softwareApplicationJsonLd(opts: {
  name: string;
  description: string;
  locale: Locale;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: opts.name,
    applicationCategory: "UtilitiesApplication",
    operatingSystem: "macOS, Windows",
    softwareVersion: siteConfig.appVersion,
    description: opts.description,
    url: localizedUrl(opts.locale),
    downloadUrl: siteConfig.downloadUrl,
    inLanguage: opts.locale,
    isAccessibleForFree: true,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "USD",
    },
    operatingSystemVersion: `macOS ${siteConfig.minMacOS}+`,
  };
}

/** FAQPage 结构化数据 —— 有机会拿到搜索结果里的 FAQ 富摘要 */
export function faqJsonLd(items: { q: string; a: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.a,
      },
    })),
  };
}

/** 站点级 WebSite 结构化数据 */
export function websiteJsonLd(opts: { name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts.name,
    url: siteUrl,
    description: opts.description,
  };
}
