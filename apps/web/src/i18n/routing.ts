import { defineRouting } from "next-intl/routing";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // The default locale (en) has no prefix (site root /), while other locales are prefixed (/zh) for cleaner, more SEO-friendly URLs
  localePrefix: "as-needed",
});
