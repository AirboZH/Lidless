/**
 * Data layer for the "Did Codex reset today?" page.
 *
 * We don't run our own monitor — we mirror the community tracker at
 * hascodexratelimitreset.today, which already polls OpenAI's Codex team posts,
 * classifies them, and computes a rolling-window verdict. Its `/api/status`
 * sends no CORS headers, so the browser can't read it cross-origin; the page
 * fetches it server-side here, and the client polls our same-origin proxy at
 * /api/codex-status (see app/api/codex-status/route.ts).
 */

import type { Locale } from "@/i18n/routing";

export type VerdictStatus = "yes" | "no" | "unknown";

export type CodexVerdict = {
  /** Headline answer, mirrored from upstream's rolling-window `state`. */
  status: VerdictStatus;
  /** ISO timestamp of upstream's last check. */
  lastCheckedISO: string;
  /** False when we couldn't reach upstream (UI shows a degraded badge). */
  monitorLive: boolean;
  /** Upstream classifier rationale for the most recent tracked post. */
  reason?: string;
  /** Link to the X post behind the current verdict. */
  sourceUrl?: string;
};

// Upstream community monitor we mirror. Its `state` already honors the rolling
// window (autoResetHours), so we surface it verbatim — same logic as the source.
export const UPSTREAM_STATUS_URL =
  process.env.CODEX_STATUS_URL ?? "https://hascodexratelimitreset.today/api/status";
export const UPSTREAM_SITE_URL = "https://hascodexratelimitreset.today";
export const UPSTREAM_SITE_LABEL = "hascodexratelimitreset.today";

// Display only — the verdict is NOT timezone-based (it mirrors upstream's
// rolling window). OpenAI posts are US-centric, so clock times read in Pacific.
const DISPLAY_TZ = "America/Los_Angeles";

type UpstreamEntry = {
  checkedAt?: number;
  rationale?: string;
  tweetUrl?: string;
  verdict?: string;
};

type UpstreamStatus = {
  state?: string;
  updatedAt?: number;
  automationSummary?: {
    latest?: UpstreamEntry;
    lastReset?: UpstreamEntry;
  };
};

const VALID: VerdictStatus[] = ["yes", "no", "unknown"];

/** Manual override (CODEX_RESET_OVERRIDE=yes|no|unknown) for emergencies. */
function readOverride(): VerdictStatus | null {
  const v = process.env.CODEX_RESET_OVERRIDE?.trim().toLowerCase();
  return VALID.includes(v as VerdictStatus) ? (v as VerdictStatus) : null;
}

/** Map upstream's /api/status payload to our verdict shape. Pure + defensive. */
export function normalizeUpstream(data: UpstreamStatus): CodexVerdict {
  const latest = data.automationSummary?.latest;
  const lastReset = data.automationSummary?.lastReset;
  const state = (data.state ?? "").toLowerCase();
  const status: VerdictStatus =
    state === "yes" ? "yes" : state === "no" ? "no" : "unknown";
  const checkedAt = latest?.checkedAt ?? data.updatedAt;

  return {
    status,
    lastCheckedISO: new Date(checkedAt ?? Date.now()).toISOString(),
    monitorLive: true,
    reason: latest?.rationale,
    // When a reset is live, link the reset post; otherwise the latest tracked post.
    sourceUrl:
      (status === "yes" ? lastReset?.tweetUrl : latest?.tweetUrl) ??
      latest?.tweetUrl,
  };
}

/** Server-side: fetch upstream and normalize, with a manual override + safe fallback. */
export async function getVerdict(): Promise<CodexVerdict> {
  const override = readOverride();
  try {
    const res = await fetch(UPSTREAM_STATUS_URL, {
      headers: {
        Accept: "application/json",
        "User-Agent": "lidless.cc/codex-reset (+https://lidless.cc)",
      },
      // Thin cache so we don't hammer upstream; the client also polls our proxy.
      next: { revalidate: 60 },
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const verdict = normalizeUpstream((await res.json()) as UpstreamStatus);
    return override ? { ...verdict, status: override } : verdict;
  } catch {
    return {
      status: override ?? "unknown",
      lastCheckedISO: new Date().toISOString(),
      monitorLive: false,
    };
  }
}

const intlLocale = (locale: Locale | string) =>
  locale === "zh" ? "zh-CN" : "en-US";

/** Localized "June 5, 2026" / "2026年6月5日" for the title's date stamp. */
export function formatToday(locale: Locale | string, now: Date = new Date()): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: DISPLAY_TZ,
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(now);
}

/** Localized clock time (with zone) for the "last checked" line. */
export function formatCheckedAt(locale: Locale | string, iso: string): string {
  return new Intl.DateTimeFormat(intlLocale(locale), {
    timeZone: DISPLAY_TZ,
    hour: "2-digit",
    minute: "2-digit",
    timeZoneName: "short",
  }).format(new Date(iso));
}
