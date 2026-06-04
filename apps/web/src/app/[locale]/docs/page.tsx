import type { Metadata } from "next";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { JsonLd } from "@/components/json-ld";
import { mdxComponents } from "@/components/docs/mdx-components";
import { siteConfig } from "@/config/site";
import { mdxOptions } from "@/lib/docs/mdx";
import { getDoc, getOrderedDocs } from "@/lib/docs/source";
import { breadcrumbJsonLd, buildAlternates, localizedUrl } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale } = await params;
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "Docs" });
  const index = getDoc(loc, []);
  const title = index?.frontmatter.title ?? t("title");
  const description = index?.frontmatter.description ?? t("description");

  return {
    title,
    description,
    alternates: buildAlternates(loc, "/docs"),
    openGraph: {
      type: "website",
      siteName: siteConfig.name,
      title,
      description,
      url: localizedUrl(loc, "/docs"),
      locale: loc === "zh" ? "zh_CN" : "en_US",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.twitter || undefined,
    },
  };
}

/**
 * Docs landing (/docs). Renders the optional content/docs/<locale>/index.mdx
 * intro, then an auto-generated card list of every doc in sidebar order.
 */
export default async function DocsHome({ params }: Params) {
  const { locale } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;
  const t = await getTranslations({ locale, namespace: "Docs" });

  const index = getDoc(loc, []);
  const docs = getOrderedDocs(loc);

  return (
    <div className="mx-auto max-w-3xl">
      <JsonLd
        data={breadcrumbJsonLd([
          { name: siteConfig.name, url: localizedUrl(loc, "/") },
          { name: t("title"), url: localizedUrl(loc, "/docs") },
        ])}
      />
      {index ? (
        <article className="prose prose-invert prose-docs max-w-none">
          <header className="not-prose mb-8">
            <h1 className="text-3xl font-bold tracking-tight text-ink">
              {index.frontmatter.title}
            </h1>
            {index.frontmatter.description && (
              <p className="mt-3 text-lg leading-relaxed text-muted">
                {index.frontmatter.description}
              </p>
            )}
          </header>
          <MDXRemote
            source={index.content}
            components={mdxComponents}
            options={{ mdxOptions }}
          />
        </article>
      ) : (
        <h1 className="text-3xl font-bold tracking-tight text-ink">{t("title")}</h1>
      )}

      {docs.length > 0 && (
        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          {docs.map((doc) => (
            <Link
              key={doc.slug}
              href={doc.url}
              className="rounded-xl border border-hairline bg-surface p-5 transition hover:border-accent/50"
            >
              <span className="font-medium text-ink">{doc.frontmatter.title}</span>
              {doc.frontmatter.description && (
                <p className="mt-1 text-sm leading-relaxed text-muted">
                  {doc.frontmatter.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
