"use client";

import { useEffect, useState } from "react";
import { useCockpit } from "@/lib/cockpit/context";
import { CockpitUserMenu } from "./CockpitUserMenu";
import { fetchOpenAlerts } from "@/lib/cockpit/api/observability";
import { fetchTenants } from "@/lib/cockpit/api/tenantAdmin";

type TenantOpt = { id: string; name: string };

export function CockpitTopbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { tenantFilter, setTenantFilter, isTenantAdminOnly } = useCockpit();
  const [clock, setClock] = useState("");
  const [tenants, setTenants] = useState<TenantOpt[]>([]);
  const [alertCount, setAlertCount] = useState(0);

  useEffect(() => {
    const tick = () => {
      setClock(
        new Date().toLocaleString("es-DO", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true,
        }),
      );
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (isTenantAdminOnly) return;
    void fetchTenants().then((r) =>
      setTenants(r.tenants.map((t) => ({ id: t.id, name: t.name }))),
    );
    void fetchOpenAlerts().then((r) => setAlertCount(r.data.alerts?.length ?? 0));
  }, [isTenantAdminOnly]);

  return (
    <header
      className="flex flex-wrap items-center justify-between gap-3 border-b border-cockpit-border bg-cockpit-surface px-4 py-3"
      data-testid="cockpit-topbar"
    >
      <div className="flex items-center gap-3">
        <button type="button" className="text-cockpit-muted lg:hidden" onClick={onMenuClick} aria-label="Abrir menú">
          ☰
        </button>
        <label className="text-xs text-cockpit-muted" htmlFor="cockpit-tenant-select">
          Tenant
        </label>
        <select
          id="cockpit-tenant-select"
          className="rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-1.5 text-sm text-cockpit-text"
          value={tenantFilter ?? ""}
          disabled={isTenantAdminOnly}
          onChange={(e) => setTenantFilter(e.target.value || null)}
        >
          <option value="">Todos los tenants</option>
          {tenants.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex items-center gap-4">
        <time className="font-cockpitMono text-xs tabular-nums text-cockpit-muted">{clock}</time>
        <button type="button" className="relative text-cockpit-muted" aria-label="Alertas">
          🔔
          {alertCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-cockpit-err text-[10px] text-white">
              {alertCount}
            </span>
          ) : null}
        </button>
        <CockpitUserMenu />
      </div>
    </header>
  );
}
