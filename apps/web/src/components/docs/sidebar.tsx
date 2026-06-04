"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import type { SidebarGroup } from "@/lib/docs/source";

function SidebarLinks({
  groups,
  pathname,
  onNavigate,
}: {
  groups: SidebarGroup[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <nav className="space-y-6">
      {groups.map((group, gi) => (
        <div key={group.title || `group-${gi}`}>
          {group.title && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">
              {group.title}
            </p>
          )}
          <ul className="space-y-1 border-l border-hairline">
            {group.items.map((item) => {
              const active = pathname === item.url;
              return (
                <li key={item.slug}>
                  <Link
                    href={item.url}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={`-ml-px block border-l py-1 pl-4 text-sm transition-colors ${
                      active
                        ? "border-accent font-medium text-ink"
                        : "border-transparent text-muted hover:border-hairline hover:text-ink"
                    }`}
                  >
                    {item.frontmatter.title}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

/**
 * Docs left rail. Sticky on desktop; a collapsible disclosure on mobile so the
 * doc tree stays reachable without taking over the small-screen layout.
 */
export function DocsSidebar({ groups }: { groups: SidebarGroup[] }) {
  const t = useTranslations("Docs");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <>
      {/* Mobile: collapsible */}
      <div className="lg:hidden">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex w-full items-center justify-between rounded-lg border border-hairline px-4 py-2.5 text-sm text-ink"
        >
          {t("menu")}
          <span aria-hidden className={`transition-transform ${open ? "rotate-180" : ""}`}>
            ▾
          </span>
        </button>
        {open && (
          <div className="mt-3 px-1">
            <SidebarLinks
              groups={groups}
              pathname={pathname}
              onNavigate={() => setOpen(false)}
            />
          </div>
        )}
      </div>

      {/* Desktop: sticky rail */}
      <div className="hidden lg:block">
        <div className="sticky top-24">
          <SidebarLinks groups={groups} pathname={pathname} />
        </div>
      </div>
    </>
  );
}
