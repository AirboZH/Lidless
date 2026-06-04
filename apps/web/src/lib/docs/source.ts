import "server-only";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { locales, type Locale } from "@/i18n/routing";
import { buildToc } from "./toc";
import type { Doc, DocFrontmatter, DocMeta } from "./types";

/**
 * Filesystem-backed docs source. Content lives as .mdx files under
 * apps/web/content/docs/<locale>/..., and is read at build time (the whole site
 * is statically generated), so nothing here runs at request time in production.
 *
 * The slug mirrors the file path: `guides/claude-code.mdx` → `guides/claude-code`,
 * and `index.mdx` (at any level) → the directory's slug. Files/dirs starting with
 * "_" (e.g. `_templates/`) or "." are ignored, so authoring skeletons never ship.
 */
const DOCS_ROOT = path.join(process.cwd(), "content", "docs");
const isProd = process.env.NODE_ENV === "production";

function localeDir(locale: Locale): string {
  return path.join(DOCS_ROOT, locale);
}

/** Recursively collect every .mdx file under `dir`, as paths relative to it. */
function walk(dir: string, base = dir): string[] {
  if (!fs.existsSync(dir)) return [];
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name.startsWith("_") || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full, base));
    else if (entry.name.endsWith(".mdx")) out.push(path.relative(base, full));
  }
  return out;
}

/** `guides/claude-code.mdx` → `guides/claude-code`; `index.mdx` → ``. */
function fileToSlug(relPath: string): string {
  const noExt = relPath.replace(/\.mdx$/, "").split(path.sep).join("/");
  if (noExt === "index") return "";
  return noExt.replace(/\/index$/, "");
}

/**
 * gray-matter (via js-yaml) parses an unquoted `updated: 2026-06-04` into a JS
 * Date, which then breaks the next-intl `{date}` message. Coerce it back to a
 * plain "YYYY-MM-DD" string so frontmatter values are always serializable.
 */
function normalizeFrontmatter(data: Record<string, unknown>): DocFrontmatter {
  const fm = { ...data } as unknown as DocFrontmatter;
  if (data.updated instanceof Date) {
    fm.updated = data.updated.toISOString().slice(0, 10);
  }
  return fm;
}

function toMeta(locale: Locale, slug: string, fm: DocFrontmatter): DocMeta {
  return {
    slug,
    segments: slug ? slug.split("/") : [],
    locale,
    frontmatter: fm,
    url: slug ? `/docs/${slug}` : "/docs",
  };
}

/** All docs for a locale (frontmatter only). Drafts are excluded in production. */
export function getAllDocMeta(locale: Locale): DocMeta[] {
  return walk(localeDir(locale))
    .map((rel) => {
      const raw = fs.readFileSync(path.join(localeDir(locale), rel), "utf8");
      const { data } = matter(raw);
      return toMeta(locale, fileToSlug(rel), normalizeFrontmatter(data));
    })
    .filter((m) => !(isProd && m.frontmatter.draft));
}

/** Loads one doc (body + TOC) by its path segments, or null if it doesn't exist. */
export function getDoc(locale: Locale, segments: string[]): Doc | null {
  const slug = segments.join("/");
  const candidates = slug ? [`${slug}.mdx`, `${slug}/index.mdx`] : ["index.mdx"];

  for (const candidate of candidates) {
    const file = path.join(localeDir(locale), candidate);
    if (!fs.existsSync(file)) continue;

    const { content, data } = matter(fs.readFileSync(file, "utf8"));
    const fm = normalizeFrontmatter(data);
    if (isProd && fm.draft) return null;

    return { ...toMeta(locale, slug, fm), content, toc: buildToc(content) };
  }
  return null;
}

/** A sidebar section: a group heading plus its ordered docs. */
export interface SidebarGroup {
  title: string;
  items: DocMeta[];
}

function byOrderThenTitle(a: DocMeta, b: DocMeta): number {
  return (
    (a.frontmatter.order ?? 100) - (b.frontmatter.order ?? 100) ||
    a.frontmatter.title.localeCompare(b.frontmatter.title)
  );
}

/**
 * Builds the sidebar tree for a locale: docs bucketed by `group`, each group
 * sorted by `order`, and the groups themselves ordered by their lowest `order`.
 * The ungrouped bucket (no `group`) is rendered first.
 */
export function getSidebar(locale: Locale): SidebarGroup[] {
  const buckets = new Map<string, DocMeta[]>();
  for (const meta of getAllDocMeta(locale)) {
    if (meta.slug === "") continue; // the index isn't a sidebar entry
    const key = meta.frontmatter.group ?? "";
    const list = buckets.get(key) ?? [];
    list.push(meta);
    buckets.set(key, list);
  }

  return [...buckets.entries()]
    .map(([title, items]) => ({ title, items: items.sort(byOrderThenTitle) }))
    .sort((a, b) => {
      if (a.title === "") return -1; // ungrouped first
      if (b.title === "") return 1;
      const minA = Math.min(...a.items.map((i) => i.frontmatter.order ?? 100));
      const minB = Math.min(...b.items.map((i) => i.frontmatter.order ?? 100));
      return minA - minB || a.title.localeCompare(b.title);
    });
}

/** Flat, display-ordered list of docs (sidebar order), used for prev/next paging. */
export function getOrderedDocs(locale: Locale): DocMeta[] {
  return getSidebar(locale).flatMap((group) => group.items);
}

/** The previous/next docs around a slug, following the sidebar order. */
export function getAdjacentDocs(
  locale: Locale,
  slug: string,
): { prev?: DocMeta; next?: DocMeta } {
  const ordered = getOrderedDocs(locale);
  const index = ordered.findIndex((d) => d.slug === slug);
  if (index === -1) return {};
  return {
    prev: index > 0 ? ordered[index - 1] : undefined,
    next: index < ordered.length - 1 ? ordered[index + 1] : undefined,
  };
}

/** Every static param for the [...slug] route across all locales (excludes index). */
export function getAllDocParams(): { locale: Locale; slug: string[] }[] {
  return locales.flatMap((locale) =>
    getAllDocMeta(locale)
      .filter((m) => m.slug !== "")
      .map((m) => ({ locale, slug: m.segments })),
  );
}
