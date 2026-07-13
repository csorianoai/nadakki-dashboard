import type { ReactNode } from "react";
import { isCockpitConsolidationEnabled } from "@/lib/cockpit/consolidation";

export function AdminPanelLink({
  href,
  children,
  className = "",
  title,
}: {
  href: string;
  children: ReactNode;
  className?: string;
  title?: string;
}) {
  if (!isCockpitConsolidationEnabled()) return null;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      title={title}
      className={`inline-flex items-center rounded-lg border border-cockpit-border px-3 py-1.5 text-xs text-cockpit-muted transition-colors hover:border-cockpit-accent hover:text-cockpit-accent ${className}`}
    >
      {children}
    </a>
  );
}
