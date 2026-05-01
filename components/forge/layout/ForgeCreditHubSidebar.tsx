"use client";

import { useMemo } from "react";
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
import { useTranslations } from "@/lib/credit-hub/i18n/useTranslations";
import { cn } from "@/lib/utils";
import { personaLabel } from "@/lib/credit-hub/design/persona";

type NavItem = { id: string; href: string; label: string; icon: typeof Home };

export function ForgeCreditHubSidebar() {
  const pathname = usePathname();
  const persona = usePersona();
  const t = useTranslations();

  const items: NavItem[] = useMemo(() => {
    if (persona === "dealer") {
      return [
        { id: "d-home", href: "/credit-hub/dealer", label: t.dealer.top_nav_dashboard, icon: Home },
        { id: "d-apps", href: "/credit-hub/dealer/applications", label: "Solicitudes", icon: FileText },
        { id: "d-pre", href: "/credit-hub/dealer/preapproval", label: t.simulator.nav_short, icon: Calculator },
        { id: "d-new", href: "/credit-hub/dealer/applications/new", label: "Nueva", icon: Plus },
      ];
    }
    return [
      { id: "b-dash", href: "/credit-hub/bank", label: t.bank.nav.dashboard, icon: Gauge },
      { id: "b-queue", href: "/credit-hub/bank/applications", label: t.bank.nav.queue, icon: ClipboardList },
      { id: "b-analytics", href: "/credit-hub/bank/analytics", label: t.bank.nav.analytics, icon: BarChart3 },
      { id: "b-comp", href: "/credit-hub/bank/compliance", label: t.bank.nav.compliance, icon: ShieldCheck },
      { id: "b-audit", href: "/credit-hub/bank/audit", label: t.bank.nav.audit, icon: History },
    ];
  }, [persona, t]);

  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r border-forgeInk-200 bg-forgeSurface-card lg:flex"
      aria-label={`${personaLabel(persona)} navigation`}
    >
      <div className="border-b border-forgeInk-100 px-4 py-3">
        <p className="font-display text-forge-xs font-semibold uppercase tracking-wide text-forgeInk-500">Forge</p>
        <p className="text-forge-sm font-medium text-forgeBrand-700">{personaLabel(persona)}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            pathname === item.href ||
            (item.href !== "/credit-hub/bank" &&
              item.href !== "/credit-hub/dealer" &&
              pathname?.startsWith(item.href));
          return (
            <Link
              key={item.id}
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
        })}
      </nav>
      <div className="border-t border-forgeInk-100 px-3 pb-3 pt-5">
        <Link
          href="/credit-hub/preview"
          className="flex min-h-12 w-full min-w-[44px] items-center rounded-forge-sm px-2 py-3 text-forge-xs font-medium text-forgeInk-500 hover:bg-forgeSurface-sunken hover:text-forgeBrand-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forgeBrand-500"
        >
          UI preview
        </Link>
      </div>
    </aside>
  );
}
