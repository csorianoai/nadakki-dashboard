"use client";

import { useContext, useMemo } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  Calculator,
  ClipboardList,
  FileText,
  Gauge,
  History,
  Home,
  Plus,
  ShieldCheck,
} from "lucide-react";
import { usePersona } from "@/components/credit-hub/system/PersonaProvider";
import { Skeleton } from "@/components/forge/ui/Skeleton";
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { useTenantConfig } from "@/lib/credit-hub/hooks/useTenantConfig";
import { useTenantBranding } from "@/lib/hooks/useTenantBranding";
import { cn } from "@/lib/utils";
import { personaLabel } from "@/lib/credit-hub/design/persona";
import { DEALER_NEW_APPLICATION_QUERY } from "@/lib/credit-hub/dealer/dealerFormat";
import { AuthContext } from "@/lib/auth/auth-context";
import { RUTA_V2_POR_RUTA_BANCO, aplicaPanelBancoV2 } from "@/lib/credit-hub/bank/panel-v2-por-defecto";

type NavItem = { id: string; href: string; label: string; icon: typeof Home };

export interface ForgeCreditHubSidebarProps {
  /**
   * When true, the tenant-specific portion of the sidebar header (logo +
   * institution name) renders as a shimmer skeleton. The nav itself never
   * skeletons — IA is invariable across tenants per design rule.
   */
  showHeaderSkeleton?: boolean;
}

/**
 * Forge Credit Hub primary sidebar. Contains a tenant-themed header
 * (skeleton during branding fetch) and the persona-specific nav. The
 * nav (Bank vs Dealer) is invariable; only the header reflects tenant
 * branding.
 */
export function ForgeCreditHubSidebar({
  showHeaderSkeleton = false,
}: ForgeCreditHubSidebarProps) {
  const pathname = usePathname();
  const persona = usePersona();
  const t = useTranslations();
  const { tenantConfig } = useTenantConfig();
  const { data: branding, isPending: brandingPending } = useTenantBranding();
  // Sin AuthProvider (previews, tests) no hay roles: menu de siempre.
  const panelBancoV2 = aplicaPanelBancoV2(useContext(AuthContext)?.allRoles ?? []);

  const loadingHeader = showHeaderSkeleton || brandingPending;
  const logoSrc = branding?.logo_url ?? tenantConfig.branding.logo_url ?? null;
  const institutionLabel = branding?.display_name?.trim() ?? tenantConfig.institution_name?.trim();

  const items: NavItem[] = useMemo(() => {
    if (persona === "dealer") {
      return [
        { id: "d-home", href: "/credit-hub/dealer", label: t.dealer.top_nav_dashboard, icon: Home },
        { id: "d-apps", href: "/credit-hub/dealer/applications", label: "Solicitudes", icon: FileText },
        { id: "d-pre", href: "/credit-hub/dealer/preapproval", label: t.simulator.nav_short, icon: Calculator },
        { id: "d-new", href: `/credit-hub/dealer/applications/new?${DEALER_NEW_APPLICATION_QUERY}`, label: "Nueva", icon: Plus },
      ];
    }
    const bank: NavItem[] = [
      { id: "b-dash", href: "/credit-hub/bank", label: t.bank.nav.dashboard, icon: Gauge },
      { id: "b-queue", href: "/credit-hub/bank/applications", label: t.bank.nav.queue, icon: ClipboardList },
      { id: "b-analytics", href: "/credit-hub/bank/analytics", label: t.bank.nav.analytics, icon: BarChart3 },
      { id: "b-comp", href: "/credit-hub/bank/compliance", label: t.bank.nav.compliance, icon: ShieldCheck },
      { id: "b-audit", href: "/credit-hub/bank/audit", label: t.bank.nav.audit, icon: History },
    ];
    // BANK-V2-DEFAULT: con el interruptor apagado (default) los href no cambian.
    return panelBancoV2
      ? bank.map((i) => ({ ...i, href: RUTA_V2_POR_RUTA_BANCO[i.href] ?? i.href }))
      : bank;
  }, [persona, t, panelBancoV2]);

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r border-forgeGray-200 bg-forgeSurface-card lg:flex"
      aria-label={`${personaLabel(persona)} navigation`}
    >
      <div
        className="border-b border-forgeGray-700/30 bg-gradient-to-b from-forgeBrand-900 to-forgeBrand-950 px-4 py-3"
        data-forge-sidebar-header
      >
        {loadingHeader ? (
          <div className="flex items-center gap-3" aria-hidden>
            <Skeleton className="h-8 w-8 motion-reduce:animate-none" />
            <div className="flex flex-col gap-1">
              <Skeleton className="h-3 w-24 motion-reduce:animate-none" />
              <Skeleton className="h-2.5 w-14 motion-reduce:animate-none" />
            </div>
          </div>
        ) : (
          <>
            {logoSrc ? (
              <div className="mb-2 flex items-center gap-2">
                {/* eslint-disable-next-line @next/next/no-img-element -- tenant-provided same-origin SVG */}
                <img
                  src={logoSrc}
                  alt=""
                  width={200}
                  height={48}
                  className="h-10 w-auto max-w-[200px] object-contain object-left"
                  aria-hidden
                />
              </div>
            ) : null}
            <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeGray-300">Forge</p>
            {institutionLabel ? (
              <p className="text-forge-xs font-medium text-forgeGray-200/90">{institutionLabel}</p>
            ) : null}
            <p className="text-forge-sm font-medium text-forgeGray-50">{personaLabel(persona)}</p>
          </>
        )}
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/credit-hub/bank" &&
              item.href !== "/credit-hub/bank-v2" &&
              item.href !== "/credit-hub/dealer" &&
              pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
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
        })}
      </nav>
      <div className="border-t border-forgeGray-100 px-3 pb-3 pt-5">
        <Link
          href="/credit-hub/preview"
          className="flex min-h-12 w-full min-w-[44px] items-center rounded-forge-sm px-2 py-3 text-forge-xs font-medium text-forgeGray-500 hover:bg-forgeSurface-sunken hover:text-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          UI preview
        </Link>
      </div>
    </aside>
  );
}
