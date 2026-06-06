import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";
import { getVerdict } from "@/lib/codex-reset";

export const alt = "Did Codex reset today?";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
// Keep the share card in step with the page's verdict freshness.
export const revalidate = 300;

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const copy = {
  en: {
    question: "Did Codex reset today?",
    yes: "YES",
    no: "NO",
    unknown: "NOT YET",
    tag: "Live status · lidless.app",
  },
  zh: {
    question: "Codex 今天重置了吗？",
    yes: "重置了",
    no: "还没",
    unknown: "暂未确认",
    tag: "实时状态 · lidless.app",
  },
} as const;

const ANSWER_COLOR = {
  yes: "#34d399",
  no: "#8aa3ff",
  unknown: "#8b93b8",
} as const;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = copy[locale as keyof typeof copy] ?? copy.en;
  const { status } = await getVerdict();

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "80px",
          backgroundColor: "#0b1022",
          backgroundImage:
            "radial-gradient(900px 500px at 50% -10%, #1c2750 0%, #0b1022 60%)",
          color: "#e9edff",
          fontFamily: "sans-serif",
        }}
      >
        {/* Brand row */}
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "999px",
              backgroundColor: "#e9eeff",
              boxShadow: "inset -22px -5px 0 -4px #0b1022",
            }}
          />
          <div style={{ fontSize: "40px", fontWeight: 700, letterSpacing: 1 }}>
            Lidless
          </div>
        </div>

        {/* Question + giant answer */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ fontSize: "52px", fontWeight: 600, color: "#c4ccf0" }}>
            {c.question}
          </div>
          <div
            style={{
              fontSize: "200px",
              fontWeight: 800,
              lineHeight: 1,
              color: ANSWER_COLOR[status],
            }}
          >
            {c[status]}
          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            fontSize: "26px",
            color: "#6c8cff",
          }}
        >
          <span>{c.tag}</span>
        </div>
      </div>
    ),
    size,
  );
}
