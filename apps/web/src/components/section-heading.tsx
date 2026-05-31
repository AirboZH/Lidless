import type { ReactNode } from "react";

export function SectionHeading({
  title,
  subtitle,
  center = true,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  center?: boolean;
}) {
  return (
    <div className={center ? "mx-auto max-w-2xl text-center" : "max-w-2xl"}>
      <h2 className="text-balance text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      {subtitle ? (
        <p className="mt-4 text-pretty text-base leading-relaxed text-muted">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
