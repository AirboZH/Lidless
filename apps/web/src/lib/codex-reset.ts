/**
 * Data layer for the "Did Codex reset today?" SEO page.
 *
 * Phase 1 has no monitor backend yet, so getVerdict() answers locally (with an
 * env-var manual override). The returned shape already matches what the
 * apps/api Cloudflare Worker will write to KV in Phase 2 — so swapping the
 * source over later is a one-function change (see the note on getVerdict).
 */

import type { Locale } from "@/i18n/routing";

// A Codex limit "reset" is an OpenAI / US-centric event, so we reckon "today"
// in US Pacific time. Change this one constant to move the daily rollover.
export const RESET_TIMEZONE = "America/Los_Angeles";

export type VerdictStatus = "yes" | "no" | "unknown";

export type CodexVerdict = {
  /** The headline answer shown in giant type. */
  status: VerdictStatus;
  /** ISO timestamp of when the verdict was last checked / produced. */
  lastCheckedISO: string;
  /** Whether a live monitor is wired up. Phase 1 = false (manual / default). */
  monitorLive: boolean;
  /** Short classification note — filled by the LLM in Phase 2. */
  reason?: string;
  /** Where the verdict came from, e.g. a tracked X handle (Phase 2). */
  source?: string;
};

const VALID: VerdictStatus[] = ["yes", "no", "unknown"];

/** Manual override so a real reset day can be flipped to "yes" without a code change. */
function readOverride(): VerdictStatus | null {
  const v = process.env.CODEX_RESET_OVERRIDE?.trim().toLowerCase();
  return VALID.includes(v as VerdictStatus) ? (v as VerdictStatus) : null;
}

/**
 * Returns the current verdict.
 *
 * Phase 1: answers "no" by default (the honest answer the vast majority of
 * days — limits roll back each day), overridable via CODEX_RESET_OVERRIDE, and
 * reports monitorLive based on CODEX_MONITOR_LIVE so the UI can be upfront that
 * tracking isn't automated yet.
 *
 * Phase 2: replace the body with a fetch to the worker, e.g.
 *   const res = await fetch(`${API_BASE}/codex-reset`, { next: { revalidate: 300 } });
 *   return (await res.json()) as CodexVerdict;
 */
export async function getVerdict(): Promise<CodexVerdict> {
  return {
    status: readOverride() ?? "no",
    lastCheckedISO: new Date().toISOString(),
    monitorLive: process.env.CODEX_MONITOR_LIVE === "true",
  };
}

const intlLocale = (locale: Locale | string) =>
  locale === "zh" ? "zh-CN" : "en-US";

/** YYYY-MM-DD for "now" in the reset timezone (day key + freshness signal). */
export function todayKey(now: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: RESET_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(now);
}

/** Localized "June 5, 2026" / "2026年6月5日" for the headline + title. */
export function formatToday(locale: Locale | string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RESET_TIMEZONE,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

/** Localized clock time (with zone) for the "last checked" line. */
export function formatCheckedAt(locale: Locale | string, iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: RESET_TIMEZONE,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}
