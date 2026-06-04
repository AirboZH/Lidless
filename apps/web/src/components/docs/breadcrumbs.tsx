import { Link } from "@/i18n/navigation";

export interface Crumb {
  label: string;
  /** Locale-agnostic href; the last (current) crumb omits it. */
  href?: string;
}

/** Visual breadcrumb trail above a doc title (pairs with the BreadcrumbList JSON-LD). */
export function Breadcrumbs({ items }: { items: Crumb[] }) {
  if (items.length === 0) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className="not-prose mb-4 flex flex-wrap items-center gap-1.5 text-xs text-muted"
    >
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="flex items-center gap-1.5">
          {index > 0 && <span aria-hidden>/</span>}
          {item.href ? (
            <Link href={item.href} className="transition-colors hover:text-ink">
              {item.label}
            </Link>
          ) : (
            <span className="text-ink">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
