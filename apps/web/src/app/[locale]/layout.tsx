import type { Metadata } from "next";
import { Inter } from "next/font/google";
import Script from "next/script";
import { notFound } from "next/navigation";
import { Analytics } from "@vercel/analytics/next";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { routing, type Locale } from "@/i18n/routing";
import { siteConfig, siteUrl } from "@/config/site";
import { buildAlternates } from "@/lib/seo";
import "../globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const GA_MEASUREMENT_ID = "G-NQ1H4LFVJ1";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

type Params = { params: Promise<{ locale: string }> };

export async function generateMetadata({
  params,
}: Params): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "Meta" });
  const title = t("title");
  const description = t("description");
  const keywords = t.raw("keywords") as string[];
  const alternates = buildAlternates(locale as Locale, "/");

  return {
    metadataBase: new URL(siteUrl),
    title: {
      default: title,
      template: `%s · ${siteConfig.name}`,
    },
    description,
    keywords,
    applicationName: siteConfig.name,
    authors: [{ name: siteConfig.name }],
    alternates,
    // og:image / twitter:image are injected automatically with the correct
    // per-locale absolute URL by the file-based app/[locale]/opengraph-image.tsx,
    // so we don't set them here to avoid duplication.
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
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    category: "technology",
  };
}

export default async function LocaleLayout({
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
  // Enable static rendering for this locale
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={locale} className={inter.variable}>
      <body className="antialiased">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
        <Analytics />
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_MEASUREMENT_ID}`}
          strategy="afterInteractive"
        />
        <Script id="gtag-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${GA_MEASUREMENT_ID}');
          `}
        </Script>
      </body>
    </html>
  );
}
