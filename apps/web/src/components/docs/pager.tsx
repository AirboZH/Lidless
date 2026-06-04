import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import type { Locale } from "@/i18n/routing";
import type { DocMeta } from "@/lib/docs/types";

/** Previous / next links at the foot of a doc, following the sidebar order. */
export async function Pager({
  locale,
  prev,
  next,
}: {
  locale: Locale;
  prev?: DocMeta;
  next?: DocMeta;
}) {
  const t = await getTranslations({ locale, namespace: "Docs" });
  if (!prev && !next) return null;

  return (
    <nav className="not-prose mt-12 grid gap-3 border-t border-hairline pt-6 sm:grid-cols-2">
      {prev ? (
        <Link
          href={prev.url}
          className="group rounded-xl border border-hairline p-4 transition hover:border-accent/50"
        >
          <span className="text-xs text-muted">{t("previous")}</span>
          <span className="mt-1 block font-medium text-ink group-hover:text-accent">
            {prev.frontmatter.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {next && (
        <Link
          href={next.url}
          className="group rounded-xl border border-hairline p-4 text-right transition hover:border-accent/50 sm:col-start-2"
        >
          <span className="text-xs text-muted">{t("next")}</span>
          <span className="mt-1 block font-medium text-ink group-hover:text-accent">
            {next.frontmatter.title}
          </span>
        </Link>
      )}
    </nav>
  );
}
