"use client";

import { useRef, useState, type ComponentPropsWithoutRef } from "react";
import { useTranslations } from "next-intl";

/**
 * Replaces the default <pre> in MDX so every code block gets a copy button.
 *
 * rehype-pretty-code renders the highlighted code into <pre><code>…</code></pre>
 * at build time; we wrap that and read `innerText` on click so the copied text is
 * the plain command, free of syntax-highlight markup.
 */
export function Pre({
  children,
  className,
  ...props
}: ComponentPropsWithoutRef<"pre">) {
  const t = useTranslations("Docs");
  const ref = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  async function copy() {
    const text = ref.current?.innerText ?? "";
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* clipboard blocked (e.g. insecure context) — silently no-op */
    }
  }

  return (
    <div className="not-prose group my-7 overflow-hidden rounded-lg border border-white/10 bg-[#080d1a] shadow-[0_18px_60px_-32px_rgba(0,0,0,0.9),inset_0_1px_0_rgba(255,255,255,0.05)]">
      <div className="flex h-10 items-center justify-between border-b border-white/10 bg-white/[0.025] px-4">
        <div className="flex items-center gap-1.5" aria-hidden="true">
          <span className="h-2.5 w-2.5 rounded-full bg-[#ff6b6b]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#ffd166]/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-[#63d471]/80" />
        </div>
        <button
          type="button"
          onClick={copy}
          aria-label={copied ? t("copied") : t("copy")}
          className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/[0.04] px-2.5 py-1 text-xs font-medium text-muted opacity-80 transition hover:border-accent/40 hover:bg-accent/10 hover:text-ink focus:opacity-100 focus:outline-none focus-visible:border-accent group-hover:opacity-100"
        >
          <svg
            viewBox="0 0 24 24"
            aria-hidden="true"
            className="h-3.5 w-3.5"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {copied ? (
              <path d="m5 12 4 4L19 6" />
            ) : (
              <>
                <rect x="8" y="8" width="11" height="11" rx="2" />
                <path d="M5 15H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v1" />
              </>
            )}
          </svg>
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <pre
        ref={ref}
        className={`overflow-x-auto bg-transparent px-5 py-4 font-mono text-[0.88rem] leading-6 text-ink/90 ${className ?? ""}`}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
}
