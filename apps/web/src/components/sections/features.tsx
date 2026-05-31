import { getTranslations } from "next-intl/server";
import { FeatureIcon } from "@/components/icons";
import { SectionHeading } from "@/components/section-heading";

interface FeatureItem {
  icon: string;
  title: string;
  description: string;
}

export async function Features() {
  const t = await getTranslations("Features");
  const items = t.raw("items") as FeatureItem[];

  return (
    <section id="features" className="scroll-mt-24 px-5 py-20 lg:py-28">
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <ul className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <li
              key={item.title}
              className="group rounded-2xl border border-hairline bg-surface p-6 transition hover:border-accent/40"
            >
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-accent/10 text-accent transition group-hover:bg-accent/15">
                <FeatureIcon name={item.icon} className="h-6 w-6" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {item.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
