"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import { BarChart3, Gauge, Scale, ScrollText } from "lucide-react";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTenantModules } from "@/hooks/useTenantModules";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/forge/ui/Skeleton";

type NavEntry = {
  moduleId: string;
  href: string;
  label: string;
  icon: typeof Gauge;
};

const MODULE_NAV: NavEntry[] = [
  { moduleId: "credit_hub", href: "/credit-hub", label: "Credit Hub", icon: Gauge },
  { moduleId: "legal", href: "/legal", label: "Legal Intelligence", icon: Scale },
  { moduleId: "marketing", href: "/marketing", label: "Marketing AI", icon: BarChart3 },
  { moduleId: "sic", href: "/sic", label: "Statement Intelligence", icon: ScrollText },
];

function entryVisible(entry: NavEntry, hasModule: (m: string) => boolean, hasCreditHub: () => boolean): boolean {
  if (entry.moduleId === "credit_hub") return hasCreditHub();
  return hasModule(entry.moduleId);
}

export function ForgeAppSidebar() {
  const pathname = usePathname();
  const { tenantConfig } = useTenantConfig();
  const { hasModule, hasCreditHub, isLoading, error } = useTenantModules();

  const items = useMemo(
    () => MODULE_NAV.filter((e) => entryVisible(e, hasModule, hasCreditHub)),
    [hasCreditHub, hasModule]
  );

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r border-forgeInk-200 bg-forgeSurface-card lg:flex"
      aria-label="Modules navigation"
    >
      <div
        className="border-b border-forgeInk-700/30 bg-gradient-to-b from-forgeBrand-900 to-forgeBrand-950 px-4 py-3"
        data-forge-app-sidebar-header
      >
        {tenantConfig.branding.logo_url ? (
          <div className="mb-2 flex items-center gap-2">
            {/* eslint-disable-next-line @next/next/no-img-element -- tenant-provided same-origin SVG */}
            <img
              src={tenantConfig.branding.logo_url}
              alt=""
              width={200}
              height={48}
              className="h-10 w-auto max-w-[200px] object-contain object-left"
              aria-hidden
            />
          </div>
        ) : null}
        <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeInk-300">Nadakki</p>
        <p className="text-forge-sm font-medium text-forgeInk-50">Dashboard</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary modules">
        {isLoading ? (
          <div className="space-y-2 p-1">
            <Skeleton className="h-10 w-full rounded-forge-sm" />
            <Skeleton className="h-10 w-full rounded-forge-sm" />
          </div>
        ) : error ? (
          <p className="px-2 py-2 text-forge-xs text-forgeDanger-600">No se pudieron cargar los módulos.</p>
        ) : items.length === 0 ? (
          <p className="px-2 py-2 text-forge-xs text-forgeInk-500">No hay módulos habilitados para este tenant.</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            const active =
              item.moduleId === "credit_hub"
                ? Boolean(pathname?.startsWith("/credit-hub"))
                : item.moduleId === "legal"
                  ? pathname === "/legal" || Boolean(pathname?.startsWith("/legal/"))
                  : pathname === item.href || Boolean(pathname?.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.moduleId}
                href={item.href}
                className={cn(
                  "flex min-h-12 min-w-[44px] items-center gap-2 rounded-forge-sm px-3 py-3 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                  active ? "bg-forgeSurface-sunken text-forgeBrand-700" : "text-forgeInk-700 hover:bg-forgeSurface-sunken hover:text-forgeInk-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 text-forgeInk-500" aria-hidden />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
