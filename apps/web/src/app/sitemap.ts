import type { MetadataRoute } from "next";
import { defaultLocale, locales, type Locale } from "@/i18n/routing";
import { getAllDocMeta } from "@/lib/docs/source";
import { localizedUrl } from "@/lib/seo";

type ChangeFrequency = MetadataRoute.Sitemap[number]["changeFrequency"];

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date("2026-05-31");
  const entries: MetadataRoute.Sitemap = [];

  // Pages that exist for every locale: home, the docs landing, and the
  // daily-fresh Codex reset page (crawled often since its verdict changes).
  const staticPages: {
    path: string;
    changeFrequency: ChangeFrequency;
    lastModified: Date;
    priority: (loc: Locale) => number;
  }[] = [
    {
      path: "/",
      changeFrequency: "monthly",
      lastModified,
      priority: (loc) => (loc === "en" ? 1 : 0.9),
    },
    {
      path: "/docs",
      changeFrequency: "monthly",
      lastModified,
      priority: () => 0.7,
    },
    {
      path: "/did-codex-reset-today",
      changeFrequency: "daily",
      lastModified: new Date(),
      priority: (loc) => (loc === "en" ? 0.8 : 0.7),
    },
  ];

  for (const page of staticPages) {
    const languages = Object.fromEntries(
      locales.map((loc) => [loc, localizedUrl(loc, page.path)]),
    );
    // x-default tells Google which version to serve when no language matches.
    // Mirror the <head> hreflang (buildAlternates) so both signals agree.
    languages["x-default"] = localizedUrl(defaultLocale, page.path);
    for (const loc of locales) {
      entries.push({
        url: localizedUrl(loc, page.path),
        lastModified: page.lastModified,
        changeFrequency: page.changeFrequency,
        priority: page.priority(loc),
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
    // x-default points to the default-locale version when it exists for this doc.
    if (present.includes(defaultLocale)) {
      languages["x-default"] = localizedUrl(defaultLocale, path);
    }
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
