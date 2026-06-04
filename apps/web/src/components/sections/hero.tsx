import { getTranslations } from "next-intl/server";
import { AppWindow } from "@/components/app-window";
import { AppleIcon, GithubIcon, WindowsIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export async function Hero() {
  const t = await getTranslations("Hero");

  return (
    <section className="relative overflow-hidden px-5 pt-32 pb-20 sm:pt-36 lg:pb-28">
      {/* Top cool-toned glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute left-1/2 top-0 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-accent/15 blur-[120px]"
      />

      <div className="relative mx-auto grid max-w-6xl items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-hairline bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_var(--accent-glow)]" />
            {t("badge")}
          </span>

          <h1 className="mt-5 text-balance text-4xl font-semibold leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">
            {t("titleLine1")}
            <br />
            <span className="bg-gradient-to-r from-accent to-accent-bright bg-clip-text text-transparent">
              {t("titleLine2")}
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-pretty text-lg leading-relaxed text-muted">
            {t("subtitle")}
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-3">
            <a
              href={siteConfig.macDownloadUrl}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-6 py-3 text-base font-medium text-white shadow-glow transition hover:bg-accent-bright"
            >
              <AppleIcon className="h-5 w-5" />
              {t("download")}
            </a>
            <a
              href={siteConfig.windowsDownloadUrl}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-base font-medium text-ink transition hover:border-accent/50"
            >
              <WindowsIcon className="h-5 w-5" />
              {t("downloadWindows")}
            </a>
            <a
              href={siteConfig.githubUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-6 py-3 text-base font-medium text-ink transition hover:border-accent/50"
            >
              <GithubIcon className="h-5 w-5" />
              {t("github")}
            </a>
          </div>

          <p className="mt-4 text-sm text-muted">
            {t("downloadMeta", {
              min: siteConfig.minMacOS,
              version: siteConfig.appVersion,
            })}
            {" · "}
            {t("trust")}
          </p>
        </div>

        {/* App panel visual */}
        <div className="flex justify-center lg:justify-end">
          <div className="relative">
            <div
              aria-hidden
              className="absolute -inset-10 rounded-full bg-accent/10 blur-3xl"
            />
            <div className="relative">
              <AppWindow />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
