import { getTranslations } from "next-intl/server";
import { ChevronDown } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

interface FaqItem {
  q: string;
  a: string;
}

export async function Faq() {
  const t = await getTranslations("Faq");
  const items = t.raw("items") as FaqItem[];

  return (
    <section id="faq" className="scroll-mt-24 px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-3xl">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <div className="mt-12 divide-y divide-white/5 overflow-hidden rounded-2xl border border-hairline bg-surface">
          {items.map((item) => (
            <details key={item.q} className="group px-6">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 text-left text-base font-medium [&::-webkit-details-marker]:hidden">
                {item.q}
                <ChevronDown className="h-5 w-5 shrink-0 text-muted transition-transform duration-200 group-open:rotate-180" />
              </summary>
              <p className="pb-5 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
