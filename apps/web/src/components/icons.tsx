import type { ReactElement, SVGProps } from "react";
import type { UseCaseIconKey } from "@/lib/cms";

type IconProps = SVGProps<SVGSVGElement>;

/** Shared base attributes for the line icons */
function base(props: IconProps): IconProps {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.6,
    strokeLinecap: "round",
    strokeLinejoin: "round",
    "aria-hidden": true,
    ...props,
  };
}

/* ── Brand ─────────────────────────────────────────── */

/** Moon logo — the same "lidless eye" motif as the desktop app */
export function MoonMark(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  );
}

/* ── Common ────────────────────────────────────────── */

export function GithubIcon(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M12 2C6.48 2 2 6.58 2 12.25c0 4.53 2.87 8.37 6.84 9.73.5.1.68-.22.68-.49 0-.24-.01-.88-.01-1.73-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.5-1.11-1.5-.91-.64.07-.62.07-.62 1 .07 1.53 1.06 1.53 1.06.89 1.56 2.34 1.11 2.91.85.09-.66.35-1.11.63-1.37-2.22-.26-4.56-1.14-4.56-5.07 0-1.12.39-2.03 1.03-2.75-.1-.26-.45-1.3.1-2.71 0 0 .84-.28 2.75 1.05a9.3 9.3 0 0 1 5 0c1.91-1.33 2.75-1.05 2.75-1.05.55 1.41.2 2.45.1 2.71.64.72 1.03 1.63 1.03 2.75 0 3.94-2.34 4.81-4.57 5.06.36.32.68.94.68 1.9 0 1.37-.01 2.48-.01 2.82 0 .27.18.6.69.49A10.26 10.26 0 0 0 22 12.25C22 6.58 17.52 2 12 2Z" />
    </svg>
  );
}

export function AppleIcon(props: IconProps) {
  return (
    <svg {...base({ ...props, fill: "currentColor", stroke: "none" })}>
      <path d="M16.37 12.6c-.02-2.05 1.67-3.03 1.75-3.08-.95-1.4-2.44-1.59-2.97-1.61-1.26-.13-2.47.74-3.11.74-.64 0-1.63-.72-2.69-.7-1.38.02-2.66.8-3.37 2.04-1.44 2.5-.37 6.2 1.03 8.23.68.99 1.49 2.1 2.56 2.06 1.03-.04 1.42-.66 2.66-.66 1.24 0 1.59.66 2.68.64 1.11-.02 1.81-1 2.49-2 .78-1.15 1.1-2.26 1.12-2.32-.02-.01-2.15-.83-2.18-3.28ZM14.4 6.4c.56-.68.94-1.62.84-2.56-.81.03-1.79.54-2.37 1.22-.52.6-.97 1.56-.85 2.48.9.07 1.82-.46 2.38-1.14Z" />
    </svg>
  );
}

export function GlobeIcon(props: IconProps) {
  return (
    <svg {...base(props)}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.5 2.5 15 0 18M12 3c-2.5 2.5-2.5 15 0 18" />
    </svg>
  );
}

export function ChevronDown(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

export function ArrowRight(props: IconProps) {
  return (
    <svg {...base(props)}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/* ── Feature section icons ─────────────────────────── */

const featureIcons = {
  switch: (props: IconProps) => (
    <svg {...base(props)}>
      <rect x="2" y="7" width="20" height="10" rx="5" />
      <circle cx="16" cy="12" r="2.4" fill="currentColor" stroke="none" />
    </svg>
  ),
  plug: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M9 2v5M15 2v5" />
      <path d="M6 7h12v3a6 6 0 0 1-12 0V7Z" />
      <path d="M12 16v6" />
    </svg>
  ),
  tray: (props: IconProps) => (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M3 14h4l1.5 2.5h7L17 14h4" />
    </svg>
  ),
  cross: (props: IconProps) => (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  ),
  feather: (props: IconProps) => (
    <svg {...base(props)}>
      <path d="M20 8a6 6 0 0 0-8.5-.5L4 15v5h5l7.5-7.5A6 6 0 0 0 20 8Z" />
      <path d="M16 8 6 18M14 10h-3" />
    </svg>
  ),
  lock: (props: IconProps) => (
    <svg {...base(props)}>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </svg>
  ),
} as const;

export type FeatureIconKey = keyof typeof featureIcons;

export function FeatureIcon({
  name,
  ...props
}: { name: string } & IconProps) {
  const Cmp = featureIcons[name as FeatureIconKey] ?? featureIcons.switch;
  return <Cmp {...props} />;
}

/* ── Use case section icons ────────────────────────── */

const useCaseIcons: Record<
  UseCaseIconKey,
  (props: IconProps) => ReactElement
> = {
  terminal: (props) => (
    <svg {...base(props)}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="m7 9 3 3-3 3M13 15h4" />
    </svg>
  ),
  remote: (props) => (
    <svg {...base(props)}>
      <rect x="2" y="4" width="20" height="13" rx="2" />
      <path d="M8 21h8M12 17v4" />
      <path d="M9 9a4.2 4.2 0 0 1 6 0M11 11.5a1.4 1.4 0 0 1 2 0" />
    </svg>
  ),
  download: (props) => (
    <svg {...base(props)}>
      <path d="M12 3v12M7 10l5 5 5-5" />
      <path d="M4 21h16" />
    </svg>
  ),
  build: (props) => (
    <svg {...base(props)}>
      <path d="M14.5 5.5a3.5 3.5 0 0 0-4.9 4.4L4 15.5 8.5 20l5.6-5.6a3.5 3.5 0 0 0 4.4-4.9l-2.5 2.5-2-2 2.5-2.5Z" />
    </svg>
  ),
  media: (props) => (
    <svg {...base(props)}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m10 9 5 3-5 3V9Z" fill="currentColor" stroke="none" />
    </svg>
  ),
  moon: (props) => (
    <svg {...base(props)}>
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
    </svg>
  ),
};

export function UseCaseIcon({
  name,
  ...props
}: { name: UseCaseIconKey } & IconProps) {
  const Cmp = useCaseIcons[name] ?? useCaseIcons.moon;
  return <Cmp {...props} />;
}
