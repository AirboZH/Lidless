import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { siteConfig } from "@/config/site";
import { MoonMark } from "./icons";

export async function Footer() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  const product = [
    { href: "#features", label: t("features") },
    { href: "#use-cases", label: t("useCases") },
    { href: "#how", label: t("how") },
    { href: "#faq", label: t("faq") },
  ];
  const resources = [
    { href: "/docs", label: t("docs"), external: false },
    { href: siteConfig.downloadUrl, label: t("download"), external: true },
    { href: siteConfig.githubUrl, label: t("github"), external: true },
  ];

  return (
    <footer className="border-t border-white/5 px-5 py-14">
      <div className="mx-auto grid max-w-6xl gap-10 md:grid-cols-[1.5fr_1fr_1fr]">
        <div className="max-w-sm">
          <div className="flex items-center gap-2 text-lg font-semibold">
            <MoonMark className="h-6 w-6 text-accent" />
            Lidless
          </div>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            {t("tagline")}
          </p>
        </div>

        <nav aria-label={t("productHeading")}>
          <h2 className="text-sm font-semibold text-ink">
            {t("productHeading")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {product.map((l) => (
              <li key={l.href}>
                <a href={l.href} className="transition-colors hover:text-ink">
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        <nav aria-label={t("resourcesHeading")}>
          <h2 className="text-sm font-semibold text-ink">
            {t("resourcesHeading")}
          </h2>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            {resources.map((l) =>
              l.external ? (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-ink"
                  >
                    {l.label}
                  </a>
                </li>
              ) : (
                <li key={l.href}>
                  <Link href={l.href} className="transition-colors hover:text-ink">
                    {l.label}
                  </Link>
                </li>
              ),
            )}
          </ul>
        </nav>
      </div>

      <div className="mx-auto mt-12 flex max-w-6xl flex-col gap-2 border-t border-white/5 pt-6 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
        <span>{t("rights", { year })}</span>
        <span>{t("builtWith")}</span>
      </div>
    </footer>
  );
}
