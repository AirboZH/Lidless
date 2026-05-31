import { ImageResponse } from "next/og";
import { routing } from "@/i18n/routing";

export const alt = "Lidless — keep your Mac awake while locked";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

const copy = {
  en: {
    title: "Keep your Mac awake while it's locked",
    tag: "Stay awake when locked · stay online",
  },
  zh: {
    title: "锁屏也让 Mac 保持唤醒",
    tag: "锁屏不睡眠 · 网络不掉线",
  },
} as const;

export default async function OpengraphImage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const c = copy[locale as keyof typeof copy] ?? copy.en;

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
              width: "88px",
              height: "88px",
              borderRadius: "999px",
              backgroundColor: "#e9eeff",
              boxShadow: "inset -26px -6px 0 -4px #0b1022",
            }}
          />
          <div style={{ fontSize: "46px", fontWeight: 700, letterSpacing: 1 }}>
            Lidless
          </div>
        </div>

        {/* Headline */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div
            style={{
              fontSize: "72px",
              fontWeight: 700,
              lineHeight: 1.1,
              maxWidth: "1000px",
            }}
          >
            {c.title}
          </div>
          <div style={{ fontSize: "34px", color: "#8b93b8" }}>{c.tag}</div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "26px",
            color: "#6c8cff",
          }}
        >
          <span>macOS menu bar app</span>
          <span>lidless.cc</span>
        </div>
      </div>
    ),
    size,
  );
}
