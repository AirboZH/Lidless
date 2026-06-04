import type { Locale } from "@/i18n/routing";

/** Page-level layout template, chosen via frontmatter `template`. */
export type DocTemplate = "default" | "tutorial" | "reference";

/** Frontmatter at the top of every .mdx doc. Only `title` is required. */
export interface DocFrontmatter {
  title: string;
  description?: string;
  /** Which page layout to render. Defaults to "default". */
  template?: DocTemplate;
  /** Sidebar group heading (docs without a group are listed first, ungrouped). */
  group?: string;
  /** Sort order within a group (lower comes first). Defaults to 100. */
  order?: number;
  /** Optional icon key (reused from the front-end <UseCaseIcon>). */
  icon?: string;
  /** ISO date string shown as "last updated". */
  updated?: string;
  /** When true, the doc is only visible in dev (hidden from prod build + sitemap). */
  draft?: boolean;
}

/** Lightweight doc descriptor (no body) — used for sidebar, pager, sitemap. */
export interface DocMeta {
  /** Slug relative to /docs, e.g. "guides/claude-code". Empty string for the index. */
  slug: string;
  /** The slug split into path segments, e.g. ["guides", "claude-code"]. */
  segments: string[];
  locale: Locale;
  frontmatter: DocFrontmatter;
  /** Locale-agnostic path; the next-intl <Link> adds the locale prefix. */
  url: string;
}

/** One entry in the right-hand "On this page" table of contents. */
export interface TocItem {
  /** Heading depth: 2 for ##, 3 for ###. */
  depth: number;
  text: string;
  /** Anchor id, matching the id rehype-slug assigns to the heading. */
  id: string;
}

/** A fully loaded doc: meta + raw MDX body + extracted TOC. */
export interface Doc extends DocMeta {
  /** Raw MDX body with the frontmatter stripped. */
  content: string;
  toc: TocItem[];
}
