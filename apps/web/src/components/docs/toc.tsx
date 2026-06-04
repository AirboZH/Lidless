"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { TocItem } from "@/lib/docs/types";

/**
 * Right-hand "On this page" navigation. Highlights the heading currently in view
 * via an IntersectionObserver (scrollspy).
 *
 * Positioning: absolutely anchored to the centered article column (its parent is
 * `relative`), sitting in the right gutter via `left-full`. This deliberately
 * keeps the TOC OUT of the document flow so it never shifts or un-centers the
 * reading column. Hidden below xl, where the gutter is too narrow to hold it.
 */
export function Toc({ items }: { items: TocItem[] }) {
  const t = useTranslations("Docs");
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (items.length === 0) return;
    const headings = items
      .map((i) => document.getElementById(i.id))
      .filter((el): el is HTMLElement => el !== null);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length > 0) setActiveId(visible[0].target.id);
      },
      // Bias the "active" line toward the top quarter of the viewport
      { rootMargin: "-80px 0px -70% 0px", threshold: 0 },
    );

    for (const el of headings) observer.observe(el);
    return () => observer.disconnect();
  }, [items]);

  if (items.length === 0) return null;

  return (
    <aside className="absolute inset-y-0 left-full hidden xl:block">
      <div className="sticky top-24 ml-10 max-h-[calc(100vh-7rem)] w-52 overflow-y-auto pb-10 [scrollbar-width:thin]">
        <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.08em] text-muted/70">
          {t("onThisPage")}
        </p>
        <nav>
          <ul className="space-y-px border-l border-hairline text-[0.82rem] leading-5">
            {items.map((item) => (
              <li
                key={item.id}
                style={{ paddingLeft: (item.depth - 2) * 12 }}
              >
                <a
                  href={`#${item.id}`}
                  className={`-ml-px block border-l py-1 pl-3 transition-colors ${
                    activeId === item.id
                      ? "border-accent font-medium text-accent-bright"
                      : "border-transparent text-muted/70 hover:border-hairline hover:text-ink"
                  }`}
                >
                  {item.text}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  );
}
