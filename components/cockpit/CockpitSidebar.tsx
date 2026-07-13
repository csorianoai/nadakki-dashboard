"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCockpit } from "@/lib/cockpit/context";
import { getTenantDashboardHome } from "@/lib/cockpit/tenant-home";
import { fetchNetworkHealth } from "@/lib/cockpit/api/observability";
import { fetchTenants } from "@/lib/cockpit/api/tenantAdmin";
import { CockpitNavLink } from "./CockpitShellLayout";

const API_HOST = process.env.NEXT_PUBLIC_API_HOST ?? "api.nadakki.io";

export function CockpitSidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { isPlatformSuperadmin } = useCockpit();
  const { tenant, allRoles } = useAuth();
  const homePath = getTenantDashboardHome(allRoles);
  const showExit = Boolean(tenant?.id);
  const [healthDot, setHealthDot] = useState<"green" | "yellow" | "red">("yellow");
  const [tenantCount, setTenantCount] = useState(0);

  const loadMeta = useCallback(async () => {
    try {
      const h = await fetchNetworkHealth();
      setHealthDot(h.data.semaphore === "green" ? "green" : h.data.semaphore === "red" ? "red" : "yellow");
    } catch {
      setHealthDot("yellow");
    }
    try {
      const t = await fetchTenants();
      setTenantCount(t.tenants.length);
    } catch {
      setTenantCount(0);
    }
  }, []);

  useEffect(() => {
    void loadMeta();
  }, [loadMeta]);

  const dotClass =
    healthDot === "green" ? "bg-cockpit-ok" : healthDot === "red" ? "bg-cockpit-err" : "bg-cockpit-warn";

  return (
    <>
      <button
        type="button"
        className="fixed left-3 top-3 z-40 rounded border border-cockpit-border bg-cockpit-surface p-2 text-cockpit-muted lg:hidden"
        onClick={onToggle}
        aria-label="Menú"
      >
        ☰
      </button>
      <aside
        className={`${open ? "translate-x-0" : "-translate-x-full"} fixed z-30 flex h-full w-60 flex-col border-r border-cockpit-border bg-cockpit-surface transition-transform lg:static lg:translate-x-0`}
        data-testid="cockpit-sidebar"
      >
        <div className="border-b border-cockpit-border p-4">
          <Link
            href={homePath}
            className="flex cursor-pointer items-center gap-3 rounded-lg transition-opacity hover:opacity-90"
            aria-label="Volver al dashboard tenant"
          >
            <div
              className="flex h-9 w-9 items-center justify-center rounded-lg text-sm font-bold text-white"
              style={{ background: "linear-gradient(135deg, #a78bfa, #6366f1)" }}
            >
              N
            </div>
            <div>
              <p className="text-base font-semibold text-cockpit-text">Nadakki</p>
              <p className="text-xs text-cockpit-muted">Network Cockpit</p>
            </div>
          </Link>
        </div>
        <nav className="flex-1 space-y-6 overflow-y-auto p-3">
          {showExit ? (
            <Link
              href={homePath}
              className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs text-cockpit-muted transition-colors hover:bg-cockpit-border/40 hover:text-cockpit-text"
            >
              <ArrowLeft className="h-3.5 w-3.5 shrink-0" aria-hidden />
              Dashboard tenant
            </Link>
          ) : null}
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-cockpit-muted">Cockpit</p>
            <div className="space-y-1">
              <CockpitNavLink href="/cockpit" label="Vista de Red" />
              <CockpitNavLink href="/cockpit/credit" label="Credit Hub" />
            </div>
          </div>
          <div>
            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-cockpit-muted">
              Gestión de plataforma
            </p>
            <div className="space-y-1">
              <CockpitNavLink href="/cockpit/tenants" label="Tenants" badge={tenantCount} />
              <CockpitNavLink href="/cockpit/users" label="Usuarios" />
              {isPlatformSuperadmin ? (
                <CockpitNavLink href="/cockpit/plans" label="Suscripciones y Planes" />
              ) : null}
            </div>
          </div>
        </nav>
        <footer className="border-t border-cockpit-border p-4 text-xs text-cockpit-muted">
          <span className={`mr-2 inline-block h-2 w-2 rounded-full ${dotClass}`} aria-hidden />
          Producción · {API_HOST}
        </footer>
      </aside>
      {open ? (
        <button type="button" className="fixed inset-0 z-20 bg-black/50 lg:hidden" aria-label="Cerrar menú" onClick={onToggle} />
      ) : null}
    </>
  );
}
