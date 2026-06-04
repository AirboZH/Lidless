import { getLocale, getTranslations } from "next-intl/server";
import { UseCaseIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";
import { getUseCases } from "@/lib/content";
import type { Locale } from "@/i18n/routing";

export async function UseCases() {
  const t = await getTranslations("UseCases");
  const locale = (await getLocale()) as Locale;
  // Content lives in src/lib/content/use-cases.ts
  const useCases = getUseCases(locale);

  return (
    <section id="use-cases" className="scroll-mt-24 px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {useCases.map((uc) => (
            <li
              key={uc.id}
              className="relative overflow-hidden rounded-2xl border border-hairline bg-surface p-6"
            >
              <div className="flex items-center gap-3">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <UseCaseIcon name={uc.icon} className="h-5 w-5" />
                </span>
                <span className="rounded-full border border-hairline px-2.5 py-0.5 text-xs font-medium text-muted">
                  {uc.tag}
                </span>
              </div>
              <h3 className="mt-5 text-lg font-semibold text-balance">
                {uc.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {uc.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
