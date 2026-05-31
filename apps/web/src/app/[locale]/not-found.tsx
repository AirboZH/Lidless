import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { ArrowRight, MoonMark } from "@/components/icons";

export default async function NotFound() {
  const t = await getTranslations("NotFound");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-5 text-center">
      <MoonMark className="h-12 w-12 text-accent" />
      <h1 className="mt-6 text-3xl font-semibold tracking-tight">
        {t("title")}
      </h1>
      <p className="mt-3 max-w-sm text-muted">{t("description")}</p>
      <Link
        href="/"
        className="mt-8 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white transition hover:bg-accent-bright"
      >
        {t("home")}
        <ArrowRight className="h-4 w-4" />
      </Link>
    </main>
  );
}
