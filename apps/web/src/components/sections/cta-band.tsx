import { getTranslations } from "next-intl/server";
import { AppleIcon, WindowsIcon } from "@/components/icons";
import { siteConfig } from "@/config/site";

export async function CtaBand() {
  const t = await getTranslations("CtaBand");

  return (
    <section className="px-5 py-20 lg:py-24">
      <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-b from-accent/[0.12] to-transparent px-6 py-16 text-center">
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]"
        />
        <div className="relative">
          <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
            {t("title")}
          </h2>
          <p className="mx-auto mt-4 max-w-md text-pretty text-muted">
            {t("subtitle")}
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <a
              href={siteConfig.macDownloadUrl}
              className="inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-glow transition hover:bg-accent-bright"
            >
              <AppleIcon className="h-5 w-5" />
              {t("download")}
            </a>
            <a
              href={siteConfig.windowsDownloadUrl}
              className="inline-flex items-center gap-2 rounded-full border border-hairline px-7 py-3.5 text-base font-medium text-ink transition hover:border-accent/50"
            >
              <WindowsIcon className="h-5 w-5" />
              {t("downloadWindows")}
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
