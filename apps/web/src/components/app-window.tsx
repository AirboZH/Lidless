import { getTranslations } from "next-intl/server";

/**
 * Visual replica of the desktop app's main panel (display only, non-interactive),
 * shown in its glowing "keep-awake active" state.
 * Mirrors the real panel in apps/desktop/src: moon brand + main toggle + AC-power option + footer.
 */
export async function AppWindow() {
  const t = await getTranslations("AppPanel");

  return (
    <div
      aria-hidden
      className="w-[300px] shrink-0 select-none rounded-2xl border border-white/10 bg-[radial-gradient(120%_120%_at_50%_0%,var(--color-bg-soft)_0%,var(--color-bg)_62%)] p-5 shadow-[0_18px_50px_rgba(0,0,0,0.55),inset_0_0_0_1px_rgba(108,140,255,0.3),0_0_42px_rgba(108,140,255,0.18)]"
    >
      {/* Brand area */}
      <div className="flex items-center gap-3.5">
        <div className="relative h-11 w-11 shrink-0 rounded-full bg-[#e9eeff] shadow-[inset_-3px_0_0_-1px_rgba(108,140,255,0.25)] drop-shadow-[0_0_10px_var(--accent-glow)]" />
        <div>
          <div className="text-lg font-semibold tracking-wide">{t("title")}</div>
          <div className="mt-0.5 text-xs text-muted">{t("tag")}</div>
        </div>
      </div>

      {/* Main toggle */}
      <div className="mt-5 flex items-center justify-between rounded-2xl border border-hairline bg-surface p-5">
        <div>
          <div className="text-[15px] font-semibold">{t("toggleLabel")}</div>
          <div className="mt-1 text-xs text-muted">{t("toggleState")}</div>
        </div>
        <div className="relative h-8 w-[58px] shrink-0 rounded-full bg-accent shadow-[0_0_16px_var(--accent-glow)]">
          <span className="absolute right-[3px] top-[3px] h-[26px] w-[26px] rounded-full bg-white" />
        </div>
      </div>

      {/* AC-power option */}
      <div className="mt-4 flex items-center gap-2.5 px-1">
        <span className="grid h-[17px] w-[17px] shrink-0 place-items-center rounded-[4px] bg-accent text-[10px] text-white">
          ✓
        </span>
        <span className="min-w-0 text-[13px] leading-tight">{t("acOnly")}</span>
        <span className="ml-auto shrink-0 whitespace-nowrap text-[11px] text-muted">
          🔌 {t("power")}
        </span>
      </div>

      {/* Footer */}
      <div className="mt-5 flex items-center justify-between text-[11px] text-muted">
        <span>{t("platform")}</span>
        <span>{t("footnote")}</span>
      </div>
    </div>
  );
}
