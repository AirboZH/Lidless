import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote-client/rsc";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { JsonLd } from "@/components/json-ld";
import { mdxComponents } from "@/components/docs/mdx-components";
import { templates } from "@/components/docs/templates";
import { siteConfig } from "@/config/site";
import { mdxOptions } from "@/lib/docs/mdx";
import { getAdjacentDocs, getAllDocParams, getDoc } from "@/lib/docs/source";
import {
  breadcrumbJsonLd,
  buildAlternates,
  localizedUrl,
  techArticleJsonLd,
} from "@/lib/seo";
import type { Locale } from "@/i18n/routing";

// Only the docs that exist at build time are valid; anything else 404s.
export const dynamicParams = false;

export function generateStaticParams() {
  return getAllDocParams();
}

type Params = { params: Promise<{ locale: string; slug: string[] }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const { locale, slug } = await params;
  const loc = locale as Locale;
  const doc = getDoc(loc, slug);
  if (!doc) return {};

  const { title, description, updated } = doc.frontmatter;
  const url = localizedUrl(loc, doc.url);

  return {
    title,
    description,
    alternates: buildAlternates(loc, doc.url),
    openGraph: {
      type: "article",
      siteName: siteConfig.name,
      title,
      description,
      url,
      locale: loc === "zh" ? "zh_CN" : "en_US",
      ...(updated ? { modifiedTime: updated, publishedTime: updated } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      creator: siteConfig.twitter || undefined,
    },
  };
}

export default async function DocPage({ params }: Params) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const loc = locale as Locale;

  const doc = getDoc(loc, slug);
  if (!doc) notFound();

  const { prev, next } = getAdjacentDocs(loc, doc.slug);
  const Template =
    templates[doc.frontmatter.template as keyof typeof templates] ??
    templates.default;

  const t = await getTranslations({ locale, namespace: "Docs" });
  const url = localizedUrl(loc, doc.url);

  return (
    <>
      <JsonLd
        data={techArticleJsonLd({
          title: doc.frontmatter.title,
          description: doc.frontmatter.description,
          url,
          locale: loc,
          dateModified: doc.frontmatter.updated,
        })}
      />
      <JsonLd
        data={breadcrumbJsonLd([
          { name: siteConfig.name, url: localizedUrl(loc, "/") },
          { name: t("title"), url: localizedUrl(loc, "/docs") },
          { name: doc.frontmatter.title, url },
        ])}
      />
      <Template doc={doc} prev={prev} next={next}>
        <MDXRemote
          source={doc.content}
          components={mdxComponents}
          options={{ mdxOptions }}
        />
      </Template>
    </>
  );
}
