"use client";

import { useLocale, useTranslations } from "next-intl";
import { useTransition } from "react";
import { usePathname, useRouter } from "@/i18n/navigation";
import { locales, type Locale } from "@/i18n/routing";
import { GlobeIcon } from "./icons";

const labels: Record<Locale, string> = {
  en: "English",
  zh: "中文",
};

export function LanguageSwitcher() {
  const t = useTranslations("Nav");
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isPending, startTransition] = useTransition();

  function onChange(next: string) {
    if (next === locale) return;
    startTransition(() => {
      // pathname already has the locale prefix stripped; rewrite it for the target locale
      router.replace(pathname, { locale: next as Locale });
    });
  }

  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">{t("language")}</span>
      <GlobeIcon className="pointer-events-none absolute left-2.5 h-4 w-4 text-muted" />
      <select
        value={locale}
        onChange={(e) => onChange(e.target.value)}
        disabled={isPending}
        aria-label={t("language")}
        className="cursor-pointer appearance-none rounded-full border border-hairline bg-surface py-1.5 pl-8 pr-7 text-sm text-ink outline-none transition hover:border-accent/50 focus-visible:border-accent disabled:opacity-50"
      >
        {locales.map((loc) => (
          <option key={loc} value={loc} className="bg-bg text-ink">
            {labels[loc]}
          </option>
        ))}
      </select>
      <svg
        aria-hidden
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-2.5 h-3.5 w-3.5 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </label>
  );
}
