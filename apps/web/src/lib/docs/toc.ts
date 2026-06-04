import GithubSlugger from "github-slugger";
import type { TocItem } from "./types";

/**
 * Extracts the ## and ### headings from raw markdown into a flat TOC.
 *
 * The ids are generated with github-slugger, the same algorithm rehype-slug uses
 * on the rendered headings — and both process headings in document order, so the
 * de-duplication suffixes ("-1", "-2") line up. That keeps the TOC anchors in
 * sync with the actual heading ids without re-parsing the compiled HTML.
 */
export function buildToc(markdown: string): TocItem[] {
  const slugger = new GithubSlugger();
  const items: TocItem[] = [];
  let inFence = false;

  for (const line of markdown.split("\n")) {
    // Skip fenced code blocks so a commented-out "## foo" inside code isn't picked up
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;

    const match = /^(#{2,3})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) continue;

    const depth = match[1].length;
    // Strip the most common inline markdown so the TOC label reads cleanly
    const text = match[2].replace(/[*_`]/g, "").trim();
    items.push({ depth, text, id: slugger.slug(text) });
  }

  return items;
}
