import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Toc } from "@/components/docs/toc";
import { Pager } from "@/components/docs/pager";
import type { Doc, DocMeta } from "@/lib/docs/types";

export interface TemplateProps {
  doc: Doc;
  prev?: DocMeta;
  next?: DocMeta;
  children: ReactNode;
}

type Variant = { proseExtra?: string; badge?: "tutorial" | "reference" };

/**
 * Shared article layout for every doc template. The named templates below are
 * thin wrappers that only tweak the reading density.
 *
 * Layout: a single reading column, centered in the viewport (`mx-auto`). The
 * "On this page" TOC is rendered as an absolutely-positioned sibling anchored to
 * this `relative` wrapper, so it floats in the right gutter WITHOUT taking flow
 * width — the prose stays centered and at full measure regardless of the TOC.
 */
async function DocShell({
  doc,
  prev,
  next,
  children,
  proseExtra = "",
  badge,
}: TemplateProps & Variant) {
  const t = await getTranslations({ locale: doc.locale, namespace: "Docs" });
  const { title, description, updated } = doc.frontmatter;

  return (
    <div className="relative mx-auto w-full max-w-[42rem]">
      <Toc items={doc.toc} />

      <article className={`prose prose-invert prose-docs article-prose min-w-0 max-w-none ${proseExtra}`}>
        <header className="not-prose mb-10 border-b border-hairline pb-8">
          <div className="mb-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-muted">
            {badge && (
              <span className="inline-flex items-center rounded-full border border-accent/30 bg-accent/10 px-2.5 py-0.5 text-xs font-medium tracking-wide text-accent-bright">
                {t(badge)}
              </span>
            )}
            <span>{updated ? t("updated", { date: updated }) : t("title")}</span>
          </div>
          <h1 className="text-balance text-3xl font-semibold leading-tight text-ink sm:text-[2.5rem] sm:leading-[1.15]">
            {title}
          </h1>
          {description && (
            <p className="mt-4 text-pretty text-base leading-8 text-muted sm:text-lg">
              {description}
            </p>
          )}
        </header>

        {children}

        <Pager locale={doc.locale} prev={prev} next={next} />
      </article>
    </div>
  );
}

/** Plain article — for concept docs and long-form prose. */
export function DefaultDoc(props: TemplateProps) {
  return <DocShell {...props} />;
}

/** Step-by-step guide — adds a "Tutorial" badge; pair with <Steps> in content. */
export function TutorialDoc(props: TemplateProps) {
  return <DocShell {...props} badge="tutorial" />;
}

/** Dense reference — "Reference" badge and tighter type for tables/CLI docs. */
export function ReferenceDoc(props: TemplateProps) {
  return <DocShell {...props} badge="reference" proseExtra="prose-sm" />;
}

/** Maps a frontmatter `template` value to its component. */
export const templates = {
  default: DefaultDoc,
  tutorial: TutorialDoc,
  reference: ReferenceDoc,
} as const;
