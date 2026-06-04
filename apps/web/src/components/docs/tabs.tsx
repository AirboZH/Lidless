"use client";

import {
  Children,
  isValidElement,
  useId,
  useState,
  type ReactElement,
  type ReactNode,
} from "react";

interface TabProps {
  /** Label shown in the tab strip, e.g. "macOS" / "Windows" / "bash". */
  label: string;
  children: ReactNode;
}

/** One panel inside <Tabs>. Rendering is handled by the parent. */
export function Tab({ children }: TabProps) {
  return <>{children}</>;
}

/**
 * Tabbed content for platform/shell variants in tutorials:
 *
 *   <Tabs>
 *     <Tab label="macOS">…</Tab>
 *     <Tab label="Windows">…</Tab>
 *   </Tabs>
 */
export function Tabs({ children }: { children: ReactNode }) {
  const tabs = Children.toArray(children).filter(
    (child): child is ReactElement<TabProps> => isValidElement(child),
  );
  const [active, setActive] = useState(0);
  const baseId = useId();

  if (tabs.length === 0) return null;

  return (
    <div className="not-prose my-7 overflow-hidden rounded-lg border border-white/10 bg-white/[0.025]">
      <div role="tablist" className="flex gap-1 overflow-x-auto border-b border-white/10 bg-white/[0.025] px-2 pt-2">
        {tabs.map((tab, i) => (
          <button
            key={`${baseId}-${i}`}
            type="button"
            role="tab"
            aria-selected={i === active}
            onClick={() => setActive(i)}
            className={`whitespace-nowrap rounded-t-md px-3 py-1.5 text-sm transition ${
              i === active
                ? "bg-bg text-ink shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                : "text-muted hover:bg-white/[0.03] hover:text-ink"
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="px-4 py-3 text-[0.95rem] leading-7 text-ink/80">{tabs[active]}</div>
    </div>
  );
}
