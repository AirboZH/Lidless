import { defineRouting } from "next-intl/routing";

export const locales = ["en", "zh"] as const;
export type Locale = (typeof locales)[number];

export const defaultLocale: Locale = "en";

export const routing = defineRouting({
  locales,
  defaultLocale,
  // 默认语言 (en) 不带前缀（站点根 /），其余语言带前缀（/zh），URL 更干净也更利于 SEO
  localePrefix: "as-needed",
});
