import type { Metadata } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { siteConfig, siteUrl } from "@/config/site";

/** Builds an absolute URL from (locale, path), following localePrefix: "as-needed" (no prefix for the default locale) */
export function localizedUrl(locale: Locale, path = "/"): string {
  const prefix = locale === defaultLocale ? "" : `/${locale}`;
  const clean = path === "/" ? "" : path.replace(/\/$/, "");
  return `${siteUrl}${prefix}${clean}` || siteUrl;
}

/**
 * canonical + hreflang. Every page should provide:
 *  - canonical pointing to the current language version
 *  - languages listing all language versions + x-default
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

/** SoftwareApplication structured data — helps Google recognize Lidless as a downloadable piece of software */
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
    // System requirements (operatingSystemVersion is not a valid Schema.org property)
    softwareRequirements: `macOS ${siteConfig.minMacOS} or later, Windows 10 or later`,
    // Disambiguate the "Lidless" software entity by linking it to its canonical repo
    sameAs: [siteConfig.githubUrl],
    creator: { "@type": "Organization", name: siteConfig.name, url: siteUrl },
  };
}

/**
 * Organization entity — anchors the publisher identity (used as author/publisher
 * elsewhere) and links out via sameAs so search + AI engines can disambiguate the brand.
 */
export function organizationJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${siteUrl}/#organization`,
    name: siteConfig.name,
    url: siteUrl,
    logo: `${siteUrl}/apple-icon.png`,
    email: siteConfig.email,
    sameAs: [siteConfig.githubUrl],
  };
}

/** FAQPage structured data — a chance to earn the FAQ rich snippet in search results */
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

/** Site-level WebSite structured data */
export function websiteJsonLd(opts: { name: string; description: string }) {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: opts.name,
    url: siteUrl,
    description: opts.description,
  };
}

/** TechArticle structured data for a docs page — helps it qualify as an article in search */
export function techArticleJsonLd(opts: {
  title: string;
  description?: string;
  /** Absolute URL of the article. */
  url: string;
  locale: Locale;
  /** ISO date (frontmatter `updated`). */
  dateModified?: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "TechArticle",
    headline: opts.title,
    ...(opts.description ? { description: opts.description } : {}),
    inLanguage: opts.locale,
    url: opts.url,
    mainEntityOfPage: opts.url,
    ...(opts.dateModified
      ? { dateModified: opts.dateModified, datePublished: opts.dateModified }
      : {}),
    author: { "@type": "Organization", name: siteConfig.name, url: siteUrl },
    publisher: { "@type": "Organization", name: siteConfig.name, url: siteUrl },
  };
}

/** BreadcrumbList structured data — a shot at the breadcrumb rich result in search */
export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}
