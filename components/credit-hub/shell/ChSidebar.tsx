"use client";

import Link from "next/link";
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
import { cn } from "@/lib/utils";
import { chPersonaLabel } from "@/lib/credit-hub/ch-base";
import type { ChNavItem, ChSidebarProps, PersonaType } from "@/lib/credit-hub/ch-types";

function navItems(persona: PersonaType): ChNavItem[] {
  if (persona === "dealer") {
    return [
      { id: "d-home", href: "/credit-hub/dealer", label: "Panel", icon: Home },
      { id: "d-apps", href: "/credit-hub/dealer/applications", label: "Solicitudes", icon: FileText },
      { id: "d-pre", href: "/credit-hub/dealer/preapproval", label: "Simulador", icon: Calculator },
      { id: "d-new", href: "/credit-hub/dealer/applications/new", label: "Nueva", icon: Plus },
    ];
  }
  return [
    { id: "b-dash", href: "/credit-hub/bank", label: "Panel", icon: Gauge },
    { id: "b-queue", href: "/credit-hub/bank/applications", label: "Bandeja", icon: ClipboardList },
    { id: "b-analytics", href: "/credit-hub/bank/analytics", label: "Analítica", icon: BarChart3 },
    { id: "b-comp", href: "/credit-hub/bank/compliance", label: "Cumplimiento", icon: ShieldCheck },
    { id: "b-audit", href: "/credit-hub/bank/audit", label: "Auditoría", icon: History },
  ];
}

function isActive(pathname: string | undefined, href: string): boolean {
  if (!pathname) return false;
  if (pathname === href) return true;
  if (href === "/credit-hub/bank" || href === "/credit-hub/dealer") return false;
  return pathname.startsWith(href);
}

export function ChSidebar({ persona, activePath = "", institutionName, logoUrl, className }: ChSidebarProps) {
  const items = navItems(persona);

  return (
    <aside
      className={cn("hidden shrink-0 flex-col lg:flex", className)}
      style={{
        width: "var(--ch-sidebar-w)",
        background: "var(--ch-persona-sidebar-bg)",
        color: "var(--ch-persona-sidebar-ink)",
        borderRight: "1px solid rgba(255,255,255,0.08)",
      }}
      aria-label={`${chPersonaLabel(persona)} navigation`}
    >
      <div className="border-b border-white/10 px-4 py-4">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={logoUrl} alt="" className="mb-2 h-8 w-auto max-w-[180px] object-contain object-left" aria-hidden />
        ) : null}
        <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[var(--ch-persona-sidebar-muted)]">Forge</p>
        {institutionName ? <p className="text-xs text-[var(--ch-persona-sidebar-muted)]">{institutionName}</p> : null}
        <p className="mt-1 text-sm font-semibold">{chPersonaLabel(persona)}</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-2" aria-label="Primary">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(activePath, item.href);
          return (
            <Link
              key={item.id}
              href={item.href}
              className={cn(
                "flex min-h-11 items-center gap-2 rounded-[var(--ch-r)] px-3 py-2 text-sm font-medium transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2",
                active ? "bg-white/12 text-white" : "text-[var(--ch-persona-sidebar-muted)] hover:bg-white/8 hover:text-white"
              )}
              aria-current={active ? "page" : undefined}
            >
              <Icon className="h-4 w-4 shrink-0" aria-hidden />
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export interface ChBottomNavProps {
  persona: PersonaType;
  activePath?: string;
  className?: string;
}

export function ChBottomNav({ persona, activePath = "", className }: ChBottomNavProps) {
  const items = navItems(persona).slice(0, 4);

  return (
    <nav
      className={cn("fixed inset-x-0 bottom-0 z-40 flex border-t lg:hidden", className)}
      style={{
        height: "var(--ch-bottom-nav-h)",
        background: "var(--ch-surface)",
        borderColor: "var(--ch-line)",
      }}
      aria-label="Mobile navigation"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const active = isActive(activePath, item.href);
        return (
          <Link
            key={item.id}
            href={item.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-semibold focus-visible:outline focus-visible:outline-2"
            style={{ color: active ? "var(--ch-persona-primary)" : "var(--ch-ink-3)" }}
            aria-current={active ? "page" : undefined}
          >
            <Icon className="h-5 w-5" aria-hidden />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
