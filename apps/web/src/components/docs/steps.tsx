import type { ReactNode } from "react";

/**
 * A vertical, auto-numbered step list for tutorials. The numbering and the
 * connecting line are CSS-driven (see `.doc-steps` / `.doc-step` in globals.css),
 * so authors just nest <Step> elements:
 *
 *   <Steps>
 *     <Step title="Install">…</Step>
 *     <Step title="Run">…</Step>
 *   </Steps>
 */
export function Steps({ children }: { children: ReactNode }) {
  return <div className="doc-steps not-prose my-8">{children}</div>;
}

export function Step({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <div className="doc-step">
      {title && <p className="mb-1.5 font-semibold text-ink">{title}</p>}
      <div className="text-[0.95rem] leading-7 text-ink/70">{children}</div>
    </div>
  );
}
