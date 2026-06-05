"use client";

import { useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import type { Locale } from "@/i18n/routing";
import {
  type CodexVerdict as Verdict,
  formatToday,
  formatCheckedAt,
  UPSTREAM_SITE_URL,
  UPSTREAM_SITE_LABEL,
} from "@/lib/codex-reset";

// Per-status look. "no" is the everyday state, so it stays calm/on-brand
// rather than alarming; "yes" is the good-news celebratory state.
const STATUS_STYLES: Record<
  Verdict["status"],
  { answer: string; glow: string; dot: string }
> = {
  yes: {
    answer:
      "bg-gradient-to-br from-emerald-300 to-emerald-500 bg-clip-text text-transparent",
    glow: "bg-emerald-400/20",
    dot: "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.7)]",
  },
  no: {
    answer:
      "bg-gradient-to-br from-accent to-accent-bright bg-clip-text text-transparent",
    glow: "bg-accent/20",
    dot: "bg-accent shadow-[0_0_8px_var(--accent-glow)]",
  },
  unknown: {
    answer: "text-muted",
    glow: "bg-white/5",
    dot: "bg-muted",
  },
};

export function CodexVerdict({
  initialVerdict,
  locale,
}: {
  initialVerdict: Verdict;
  locale: Locale;
}) {
  const t = useTranslations("CodexReset");
  // SSR gives us an initial (possibly CDN-cached) verdict for SEO + instant
  // paint; we then poll the same-origin proxy for the live value.
  const [verdict, setVerdict] = useState(initialVerdict);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    setRefreshing(true);
    try {
      const res = await fetch("/api/codex-status", { cache: "no-store" });
      if (res.ok) setVerdict((await res.json()) as Verdict);
    } catch {
      /* keep the last-known verdict on a transient failure */
    } finally {
      setRefreshing(false);
    }
  }, []);

  // Refresh to live once on mount.
  useEffect(() => {
    void load();
  }, [load]);

  const s = STATUS_STYLES[verdict.status];
  const today = formatToday(locale, new Date());
  const checkedAt = formatCheckedAt(locale, verdict.lastCheckedISO);
  const reason = verdict.reason?.trim();

  return (
    <section className="relative overflow-hidden px-5 pt-32 pb-16 text-center sm:pt-36">
      {/* Answer-tinted glow behind the verdict */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-10 h-[440px] w-[820px] -translate-x-1/2 rounded-full blur-[130px] ${s.glow}`}
      />

      <div className="relative mx-auto max-w-3xl">
        {/* Live / degraded badge */}
        <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-muted">
          <span className={`h-1.5 w-1.5 rounded-full ${s.dot}`} />
          {verdict.monitorLive ? t("verdict.monitorLive") : t("verdict.monitorSoon")}
        </span>

        {/* The question is the H1 — it carries the target keyword */}
        <h1 className="mt-6 text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
          {t("verdict.question")}
        </h1>

        {/* The giant answer */}
        <p
          className={`mt-4 text-7xl font-bold leading-none tracking-tight sm:text-8xl ${s.answer}`}
        >
          {t(`verdict.${verdict.status}`)}
        </p>

        {/* One-line plain-language note */}
        <p className="mx-auto mt-7 max-w-xl text-pretty text-lg leading-relaxed text-muted">
          {t(`verdict.${verdict.status}Note`)}
        </p>

        {/* Evidence: the upstream classifier's rationale + the source post */}
        {reason && (
          <p className="mx-auto mt-5 max-w-xl text-pretty text-sm leading-relaxed text-muted/80">
            <span className="text-muted/60">“</span>
            {reason.length > 200 ? `${reason.slice(0, 200)}…` : reason}
            <span className="text-muted/60">”</span>
            {verdict.sourceUrl && (
              <>
                {" "}
                <a
                  href={verdict.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap text-accent transition hover:text-accent-bright"
                >
                  {t("verdict.viewPost")} →
                </a>
              </>
            )}
          </p>
        )}

        {/* Status line */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{t("verdict.asOf", { date: today })}</span>
          <span aria-hidden className="text-muted/40">
            ·
          </span>
          <span>{t("verdict.lastChecked", { time: checkedAt })}</span>
        </div>

        <button
          type="button"
          onClick={() => void load()}
          disabled={refreshing}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/50 disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v4h-4" />
          </svg>
          {t("verdict.refresh")}
        </button>

        {/* Data-source credit — we mirror the community monitor */}
        <p className="mt-6 text-xs text-muted/70">
          {t("verdict.credit")}{" "}
          <a
            href={UPSTREAM_SITE_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted underline decoration-dotted underline-offset-2 transition hover:text-ink"
          >
            {UPSTREAM_SITE_LABEL}
          </a>
        </p>
      </div>
    </section>
  );
}
