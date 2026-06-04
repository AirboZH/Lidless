import type { ReactNode } from "react";

type CalloutType = "note" | "tip" | "warning" | "danger";

const styles: Record<CalloutType, { box: string; icon: string; glyph: string }> = {
  note: { box: "border-accent/25 bg-accent/[0.07]", icon: "text-accent", glyph: "i" },
  tip: { box: "border-emerald-400/25 bg-emerald-400/[0.07]", icon: "text-emerald-300", glyph: "✦" },
  warning: { box: "border-amber-400/30 bg-amber-400/[0.08]", icon: "text-amber-300", glyph: "!" },
  danger: { box: "border-rose-400/30 bg-rose-400/[0.08]", icon: "text-rose-300", glyph: "✕" },
};

/**
 * Highlighted aside box for tips, notes and warnings:
 *
 *   <Callout type="warning" title="Heads up">…</Callout>
 */
export function Callout({
  type = "note",
  title,
  children,
}: {
  type?: CalloutType;
  title?: string;
  children: ReactNode;
}) {
  const s = styles[type];
  return (
    <div className={`not-prose my-7 flex gap-3 rounded-lg border px-4 py-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] ${s.box}`}>
      <span
        aria-hidden
        className={`mt-0.5 flex h-5 w-5 flex-none items-center justify-center rounded-full border border-current/60 text-[11px] font-bold ${s.icon}`}
      >
        {s.glyph}
      </span>
      <div className="min-w-0 text-[0.95rem] leading-7 text-ink/85">
        {title && <p className="mb-1 font-semibold text-ink">{title}</p>}
        {children}
      </div>
    </div>
  );
}
