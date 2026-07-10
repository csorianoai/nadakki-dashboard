"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useCockpit } from "@/lib/cockpit/context";
import { CockpitSidebar } from "./CockpitSidebar";
import { CockpitTopbar } from "./CockpitTopbar";

export function CockpitShellLayout({ children }: { children: ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex min-h-screen" data-testid="cockpit-shell-layout">
      <CockpitSidebar open={sidebarOpen} onToggle={() => setSidebarOpen((o) => !o)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <CockpitTopbar onMenuClick={() => setSidebarOpen((o) => !o)} />
        <main className="flex-1 overflow-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

export function CockpitNavLink({
  href,
  label,
  badge,
}: {
  href: string;
  label: string;
  badge?: number;
}) {
  const pathname = usePathname();
  const active = pathname === href || (href !== "/cockpit" && pathname?.startsWith(href));
  return (
    <Link
      href={href}
      className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm transition-colors ${
        active ? "bg-cockpit-accent/15 text-cockpit-text" : "text-cockpit-muted hover:bg-cockpit-border/40 hover:text-cockpit-text"
      }`}
    >
      <span>{label}</span>
      {badge != null && badge > 0 ? (
        <span className="rounded-full bg-cockpit-accent/20 px-2 py-0.5 text-xs font-cockpitMono tabular-nums text-cockpit-accent">
          {badge}
        </span>
      ) : null}
    </Link>
  );
}
