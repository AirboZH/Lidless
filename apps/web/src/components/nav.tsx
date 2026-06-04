"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { DownloadIcon, GithubIcon, MoonMark } from "./icons";
import { LanguageSwitcher } from "./language-switcher";

const sections = [
  { id: "features", key: "features" },
  { id: "use-cases", key: "useCases" },
  { id: "how", key: "how" },
  { id: "faq", key: "faq" },
] as const;

export function Nav() {
  const t = useTranslations("Nav");
  const [open, setOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-bg/70 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        {t("skipToContent")}
      </a>

      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-5">
        <Link
          href="/"
          className="flex items-center gap-2 text-[17px] font-semibold tracking-wide"
        >
          <MoonMark className="h-6 w-6 text-accent" />
          Lidless
        </Link>

        {/* Desktop navigation links */}
        <ul className="hidden items-center gap-7 text-sm text-muted md:flex">
          {sections.map((s) => (
            <li key={s.id}>
              <a
                href={`#${s.id}`}
                className="transition-colors hover:text-ink"
              >
                {t(s.key)}
              </a>
            </li>
          ))}
          <li>
            <Link href="/docs" className="transition-colors hover:text-ink">
              {t("docs")}
            </Link>
          </li>
          <li>
            <a
              href={siteConfig.feedbackUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-ink"
            >
              {t("feedback")}
            </a>
          </li>
        </ul>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:block">
            <LanguageSwitcher />
          </div>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="hidden rounded-full border border-hairline p-2 text-muted transition hover:border-accent/50 hover:text-ink sm:inline-flex"
          >
            <GithubIcon className="h-5 w-5" />
          </a>
          <a
            href={siteConfig.downloadUrl}
            className="hidden items-center gap-1.5 rounded-full bg-accent px-4 py-2 text-sm font-medium text-white transition hover:bg-accent-bright sm:inline-flex"
          >
            <DownloadIcon className="h-4 w-4" />
            {t("download")}
          </a>

          {/* Mobile hamburger */}
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-hairline text-ink md:hidden"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.8}
              strokeLinecap="round"
            >
              {open ? (
                <path d="M6 6l12 12M18 6 6 18" />
              ) : (
                <path d="M4 7h16M4 12h16M4 17h16" />
              )}
            </svg>
          </button>
        </div>
      </nav>

      {/* Mobile expanded menu */}
      {open && (
        <div className="border-t border-white/5 bg-bg/95 px-5 py-4 md:hidden">
          <ul className="flex flex-col gap-1 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a
                  href={`#${s.id}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-muted transition hover:bg-surface hover:text-ink"
                >
                  {t(s.key)}
                </a>
              </li>
            ))}
            <li>
              <Link
                href="/docs"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-muted transition hover:bg-surface hover:text-ink"
              >
                {t("docs")}
              </Link>
            </li>
            <li>
              <a
                href={siteConfig.feedbackUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-3 py-2.5 text-muted transition hover:bg-surface hover:text-ink"
              >
                {t("feedback")}
              </a>
            </li>
          </ul>
          <div className="mt-3 flex items-center justify-between gap-3 border-t border-white/5 pt-4">
            <LanguageSwitcher />
            <a
              href={siteConfig.downloadUrl}
              onClick={() => setOpen(false)}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              <DownloadIcon className="h-4 w-4" />
              {t("download")}
            </a>
          </div>
        </div>
      )}
    </header>
  );
}
