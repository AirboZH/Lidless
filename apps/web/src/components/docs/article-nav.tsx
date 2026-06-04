"use client";

import { Link } from "@/i18n/navigation";
import { useLocale } from "next-intl";
import { siteConfig } from "@/config/site";
import { MoonMark } from "@/components/icons";
import { LanguageSwitcher } from "@/components/language-switcher";

export function ArticleNav() {
  const locale = useLocale();
  const articlesLabel = locale === "zh" ? "文章" : "Articles";
  const skipLabel = locale === "zh" ? "跳到正文" : "Skip to content";

  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-bg/80 backdrop-blur-xl">
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-md focus:bg-accent focus:px-3 focus:py-1.5 focus:text-sm focus:text-white"
      >
        {skipLabel}
      </a>

      <nav className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-4 px-5">
        <Link href="/" className="flex items-center gap-2 text-sm font-semibold text-ink">
          <MoonMark className="h-5 w-5 text-accent" />
          <span>Lidless</span>
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/docs" className="hidden text-muted transition-colors hover:text-ink sm:inline">
            {articlesLabel}
          </Link>
          <a
            href={siteConfig.githubUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden text-muted transition-colors hover:text-ink sm:inline"
          >
            GitHub
          </a>
          <LanguageSwitcher />
        </div>
      </nav>
    </header>
  );
}
