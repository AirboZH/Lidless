import type { MetadataRoute } from "next";
import { locales } from "@/i18n/routing";
import { localizedUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  // 首页（每种语言一条），并在每条上声明 hreflang alternates
  const languages = Object.fromEntries(
    locales.map((loc) => [loc, localizedUrl(loc, "/")]),
  );

  return locales.map((loc) => ({
    url: localizedUrl(loc, "/"),
    lastModified: new Date("2026-05-31"),
    changeFrequency: "monthly",
    priority: loc === "en" ? 1 : 0.9,
    alternates: { languages },
  }));
}
