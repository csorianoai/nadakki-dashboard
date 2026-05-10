"use client";

import Link from "next/link";
import { useMemo } from "react";
import { usePathname } from "next/navigation";
import type { LucideIcon } from "lucide-react";
import { BarChart3, Gauge, Megaphone, Scale, ScrollText, Wallet, Wrench } from "lucide-react";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTenantModules } from "@/hooks/useTenantModules";
import type { TenantModule } from "@/hooks/useTenantModules";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/forge/ui/Skeleton";

/** Slugs with a shipped UI in this repo — expand as modules ship. */
const IMPLEMENTED_MODULE_SLUGS = new Set<string>(["credit", "legal"]);

type RouteDef = { slug: string; href: string; icon: LucideIcon };

const ROUTE_REGISTRY: RouteDef[] = [
  { slug: "credit", href: "/credit-hub", icon: Gauge },
  { slug: "legal", href: "/legal", icon: Scale },
  { slug: "sic", href: "/sic", icon: ScrollText },
  { slug: "marketing", href: "/marketing", icon: Megaphone },
  { slug: "advertising", href: "/advertising", icon: Megaphone },
  { slug: "google_ads", href: "/advertising/google-ads", icon: BarChart3 },
  { slug: "ame", href: "/ame", icon: BarChart3 },
  { slug: "autopilot", href: "/autopilot", icon: BarChart3 },
  { slug: "analytics", href: "/analytics", icon: BarChart3 },
  { slug: "reports", href: "/reports", icon: BarChart3 },
  { slug: "competitive_intel", href: "/competitor-research", icon: BarChart3 },
  { slug: "whatsapp", href: "/marketing/whatsapp", icon: BarChart3 },
  { slug: "booking", href: "/marketing/booking", icon: BarChart3 },
  { slug: "closer", href: "/closer", icon: BarChart3 },
  { slug: "billing", href: "/billing", icon: Wallet },
  { slug: "consent", href: "/consent", icon: Wrench },
  { slug: "knowledge_pipeline", href: "/library", icon: ScrollText },
  { slug: "observability", href: "/onboarding/observability", icon: Wrench },
];

const ROUTE_BY_SLUG = new Map(ROUTE_REGISTRY.map((r) => [r.slug, r]));

export type ForgeSidebarNavItem = {
  slug: string;
  label: string;
  href: string;
  icon: LucideIcon;
};

function buildSidebarItems(tenantModules: TenantModule[]): ForgeSidebarNavItem[] {
  const out: ForgeSidebarNavItem[] = [];
  for (const m of tenantModules) {
    if (!m.enabled || !IMPLEMENTED_MODULE_SLUGS.has(m.slug)) continue;
    const route = ROUTE_BY_SLUG.get(m.slug);
    if (!route) continue;
    out.push({
      slug: m.slug,
      label: m.label,
      href: route.href,
      icon: route.icon,
    });
  }
  return out;
}

function isActivePath(slug: string, pathname: string | null): boolean {
  if (slug === "credit") return Boolean(pathname?.startsWith("/credit-hub"));
  if (slug === "legal") return pathname === "/legal" || Boolean(pathname?.startsWith("/legal/"));
  const href = ROUTE_BY_SLUG.get(slug)?.href;
  if (!href) return false;
  return pathname === href || Boolean(pathname?.startsWith(`${href}/`));
}

export function ForgeAppSidebar() {
  const pathname = usePathname();
  const { tenantConfig } = useTenantConfig();
  const { modules, isLoading, error } = useTenantModules();

  const items = useMemo(() => buildSidebarItems(modules), [modules]);

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r border-forgeGray-200 bg-forgeSurface-card lg:flex"
      aria-label="Modules navigation"
    >
      <div
        className="border-b border-forgeGray-700/30 bg-gradient-to-b from-forgeBrand-900 to-forgeBrand-950 px-4 py-3"
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
        <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-300">Nadakki</p>
        <p className="text-forge-sm font-medium text-forgeGray-50">Dashboard</p>
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
          <p className="px-2 py-2 text-forge-xs text-forgeGray-500">No hay módulos habilitados para este tenant.</p>
        ) : (
          items.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.slug, pathname);
            return (
              <Link
                key={item.slug}
                href={item.href}
                className={cn(
                  "flex min-h-12 min-w-[44px] items-center gap-2 rounded-forge-sm px-3 py-3 text-forge-sm font-medium transition-colors duration-[var(--forge-duration-fast)]",
                  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500",
                  active ? "bg-forgeSurface-sunken text-forgeBrand-700" : "text-forgeGray-700 hover:bg-forgeSurface-sunken hover:text-forgeGray-900"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="h-4 w-4 shrink-0 text-forgeGray-500" aria-hidden />
                {item.label}
              </Link>
            );
          })
        )}
      </nav>
    </aside>
  );
}
