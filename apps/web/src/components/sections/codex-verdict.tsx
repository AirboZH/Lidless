import { getTranslations } from "next-intl/server";
import type { Locale } from "@/i18n/routing";
import {
  type CodexVerdict as Verdict,
  formatToday,
  formatCheckedAt,
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

export async function CodexVerdict({
  verdict,
  locale,
}: {
  verdict: Verdict;
  locale: Locale;
}) {
  const t = await getTranslations("CodexReset");
  const s = STATUS_STYLES[verdict.status];
  const today = formatToday(locale, new Date());
  const checkedAt = formatCheckedAt(locale, verdict.lastCheckedISO);

  // localePrefix is "as-needed": the default locale (en) has no prefix.
  const selfHref =
    locale === "en"
      ? "/did-codex-reset-today"
      : `/${locale}/did-codex-reset-today`;

  return (
    <section className="relative overflow-hidden px-5 pt-32 pb-16 text-center sm:pt-36">
      {/* Answer-tinted glow behind the verdict */}
      <div
        aria-hidden
        className={`pointer-events-none absolute left-1/2 top-10 h-[440px] w-[820px] -translate-x-1/2 rounded-full blur-[130px] ${s.glow}`}
      />

      <div className="relative mx-auto max-w-3xl">
        {/* Live / manual badge */}
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

        {/* Status line */}
        <div className="mt-8 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-sm text-muted">
          <span>{t("verdict.asOf", { date: today })}</span>
          <span aria-hidden className="text-muted/40">
            ·
          </span>
          <span>{t("verdict.lastChecked", { time: checkedAt })}</span>
        </div>

        <a
          href={selfHref}
          className="mt-8 inline-flex items-center gap-2 rounded-full border border-hairline px-5 py-2.5 text-sm font-medium text-ink transition hover:border-accent/50"
        >
          <svg
            viewBox="0 0 24 24"
            className="h-4 w-4"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 12a9 9 0 1 1-2.64-6.36M21 4v4h-4" />
          </svg>
          {t("verdict.refresh")}
        </a>
      </div>
    </section>
  );
}
