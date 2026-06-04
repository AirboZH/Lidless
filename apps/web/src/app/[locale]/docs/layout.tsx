import { notFound } from "next/navigation";
import { hasLocale } from "next-intl";
import { setRequestLocale } from "next-intl/server";
import { ArticleNav } from "@/components/docs/article-nav";
import { routing } from "@/i18n/routing";

/**
 * Shell for /docs pages. These pages are SEO articles first, not a product-docs
 * tree, so the chrome stays deliberately quiet and the article owns the page.
 */
export default async function DocsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
  setRequestLocale(locale);

  return (
    <>
      <ArticleNav />
      <main id="main" className="px-5 pb-24 pt-24">
        {children}
      </main>
    </>
  );
}
