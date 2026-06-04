import type { MetadataRoute } from "next";
import { locales, type Locale } from "@/i18n/routing";
import { getAllDocMeta } from "@/lib/docs/source";
import { localizedUrl } from "@/lib/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-05-31");
  const entries: MetadataRoute.Sitemap = [];

  // Pages that exist for every locale: home + the docs landing
  for (const path of ["/", "/docs"]) {
    const languages = Object.fromEntries(
      locales.map((loc) => [loc, localizedUrl(loc, path)]),
    );
    for (const loc of locales) {
      entries.push({
        url: localizedUrl(loc, path),
        lastModified,
        changeFrequency: "monthly",
        priority: path === "/" ? (loc === "en" ? 1 : 0.9) : 0.7,
        alternates: { languages },
      });
    }
  }

  // Every doc, listing only the locales it actually exists in for hreflang and
  // using its own `updated` frontmatter as lastModified (a freshness signal).
  const docLocales = new Map<string, Set<Locale>>();
  const docModified = new Map<string, Date>();
  for (const loc of locales) {
    for (const meta of getAllDocMeta(loc)) {
      if (meta.slug === "") continue;
      const set = docLocales.get(meta.url) ?? new Set<Locale>();
      set.add(loc);
      docLocales.set(meta.url, set);

      if (meta.frontmatter.updated) {
        const date = new Date(meta.frontmatter.updated);
        const current = docModified.get(meta.url);
        if (!Number.isNaN(date.getTime()) && (!current || date > current)) {
          docModified.set(meta.url, date);
        }
      }
    }
  }

  for (const [path, localeSet] of docLocales) {
    const present = [...localeSet];
    const languages = Object.fromEntries(
      present.map((loc) => [loc, localizedUrl(loc, path)]),
    );
    for (const loc of present) {
      entries.push({
        url: localizedUrl(loc, path),
        lastModified: docModified.get(path) ?? lastModified,
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: { languages },
      });
    }
  }

  return entries;
}
