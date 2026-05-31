import { getTranslations, setRequestLocale } from "next-intl/server";
import { Nav } from "@/components/nav";
import { Footer } from "@/components/footer";
import { JsonLd } from "@/components/json-ld";
import { Hero } from "@/components/sections/hero";
import { Features } from "@/components/sections/features";
import { UseCases } from "@/components/sections/use-cases";
import { HowItWorks } from "@/components/sections/how-it-works";
import { Faq } from "@/components/sections/faq";
import { CtaBand } from "@/components/sections/cta-band";
import type { Locale } from "@/i18n/routing";
import {
  faqJsonLd,
  softwareApplicationJsonLd,
  websiteJsonLd,
} from "@/lib/seo";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const tMeta = await getTranslations({ locale, namespace: "Meta" });
  const tFaq = await getTranslations({ locale, namespace: "Faq" });
  const faqItems = tFaq.raw("items") as { q: string; a: string }[];

  return (
    <>
      <JsonLd
        data={websiteJsonLd({
          name: "Lidless",
          description: tMeta("description"),
        })}
      />
      <JsonLd
        data={softwareApplicationJsonLd({
          name: "Lidless",
          description: tMeta("description"),
          locale: locale as Locale,
        })}
      />
      <JsonLd data={faqJsonLd(faqItems)} />

      <Nav />
      <main id="main">
        <Hero />
        <Features />
        <UseCases />
        <HowItWorks />
        <Faq />
        <CtaBand />
      </main>
      <Footer />
    </>
  );
}
