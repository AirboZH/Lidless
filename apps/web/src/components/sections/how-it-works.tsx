import { getTranslations } from "next-intl/server";
import { SectionHeading } from "@/components/section-heading";

interface Step {
  title: string;
  description: string;
}

export async function HowItWorks() {
  const t = await getTranslations("How");
  const steps = t.raw("steps") as Step[];

  return (
    <section
      id="how"
      className="scroll-mt-24 border-y border-white/5 bg-white/[0.015] px-5 py-20 lg:py-28"
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={t("title")} subtitle={t("subtitle")} />

        <ol className="mt-14 grid gap-5 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-hairline bg-surface p-6"
            >
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-accent/40 text-sm font-semibold text-accent">
                {i + 1}
              </span>
              <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                {step.description}
              </p>
            </li>
          ))}
        </ol>

        <p className="mx-auto mt-8 max-w-3xl text-center text-sm leading-relaxed text-muted">
          {t("techNote")}
        </p>
      </div>
    </section>
  );
}
