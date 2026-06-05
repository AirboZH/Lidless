import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { CodexVerdict } from "@/components/sections/codex-verdict";
import { AppleIcon } from "@/components/icons";
import type { Locale } from "@/i18n/routing";
import { buildAlternates, faqJsonLd, softwareApplicationJsonLd } from "@/lib/seo";
import { siteConfig } from "@/config/site";
import { getVerdict, formatToday } from "@/lib/codex-reset";

const PATH = "/did-codex-reset-today";

// Re-render at most every 5 minutes so the "last checked" time (and, in Phase 2,
// the live verdict) stay fresh without rebuilding the whole site.
export const revalidate = 300;

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "CodexReset" });
  const today = formatToday(locale, new Date());
  const title = t("meta.title", { date: today });
  const description = t("meta.description");
  const keywords = t.raw("meta.keywords") as string[];
  const alternates = buildAlternates(locale as Locale, PATH);

  return {
    title,
    description,
    keywords,
    alternates,
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: alternates.canonical as string,
      locale: locale === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.twitter || undefined,
    },
  };
}

export default async function DidCodexResetTodayPage({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations({ locale, namespace: "CodexReset" });
  const verdict = await getVerdict();
  const faqItems = t.raw("faq.items") as { q: string; a: string }[];
  const explainPoints = t.raw("explain.points") as {
    title: string;
    body: string;
  }[];

  return (
    <>
      <JsonLd data={faqJsonLd(faqItems)} />
      <JsonLd
        data={softwareApplicationJsonLd({
          name: "Lidless",
          description: t("cta.subtitle"),
          locale: locale as Locale,
        })}
      />

      <Nav />
      <main id="main">
        <CodexVerdict verdict={verdict} locale={locale as Locale} />

        {/* What this page tracks */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("explain.title")}
            </h2>
            <p className="mt-4 text-pretty leading-relaxed text-muted">
              {t("explain.body")}
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {explainPoints.map((p) => (
                <div
                  key={p.title}
                  className="rounded-2xl border border-hairline bg-surface p-5"
                >
                  <h3 className="text-sm font-semibold text-ink">{p.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ — native <details> keeps the answers in the DOM for SEO */}
        <section className="px-5 py-16">
          <div className="mx-auto max-w-3xl">
            <h2 className="text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
              {t("faq.title")}
            </h2>
            <div className="mt-8 divide-y divide-white/5 border-y border-white/5">
              {faqItems.map((item) => (
                <details key={item.q} className="group py-4">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-left font-medium text-ink">
                    {item.q}
                    <svg
                      viewBox="0 0 24 24"
                      className="h-5 w-5 shrink-0 text-muted transition-transform group-open:rotate-180"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={1.8}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="m6 9 6 6 6-6" />
                    </svg>
                  </summary>
                  <p className="mt-3 text-pretty leading-relaxed text-muted">
                    {item.a}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* Tailored CTA: waiting on Codex → keep your Mac awake with Lidless */}
        <section className="px-5 py-20 lg:py-24">
          <div className="relative mx-auto max-w-5xl overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-b from-accent/[0.12] to-transparent px-6 py-16 text-center">
            <div
              aria-hidden
              className="pointer-events-none absolute left-1/2 top-0 h-64 w-[640px] -translate-x-1/2 rounded-full bg-accent/20 blur-[100px]"
            />
            <div className="relative">
              <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
                {t("cta.title")}
              </h2>
              <p className="mx-auto mt-4 max-w-md text-pretty text-muted">
                {t("cta.subtitle")}
              </p>
              <a
                href={siteConfig.downloadUrl}
                className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-7 py-3.5 text-base font-medium text-white shadow-glow transition hover:bg-accent-bright"
              >
                <AppleIcon className="h-5 w-5" />
                {t("cta.download")}
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
