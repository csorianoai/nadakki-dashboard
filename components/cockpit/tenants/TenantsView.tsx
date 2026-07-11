"use client";

import { useCallback, useEffect, useState } from "react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { fetchTenants, toggleTenantStatus } from "@/lib/cockpit/api/tenantAdmin";
import { useCockpit } from "@/lib/cockpit/context";
import { normalizeStatus } from "@/lib/cockpit/normalize";
import type { TenantRecord } from "@/lib/cockpit/types-platform";
import { TenantWizardModal } from "@/components/cockpit/tenants/TenantWizardModal";

export function TenantsView() {
  const { isPlatformSuperadmin } = useCockpit();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [edit, setEdit] = useState<TenantRecord | null>(null);

  const load = useCallback(async () => {
    const r = await fetchTenants();
    setTenants(r.tenants);
    setIsDemo(r.isDemo);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Tenants</h1>
        {isPlatformSuperadmin ? (
          <button type="button" className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm font-medium text-cockpit-bg" onClick={() => { setEdit(null); setWizardOpen(true); }}>
            Nuevo tenant
          </button>
        ) : null}
      </div>
      {isDemo ? <DataTruthBadge level="DEMO" /> : null}
      <div className="overflow-x-auto rounded-xl border border-cockpit-border">
        <table className="w-full text-sm">
          <thead className="bg-cockpit-surface text-xs uppercase text-cockpit-muted">
            <tr>
              <th className="px-3 py-2 text-left">Nombre</th>
              <th className="px-3 py-2 text-left">Slug</th>
              <th className="px-3 py-2 text-left">Plan</th>
              <th className="px-3 py-2 text-left">Cores</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map((t) => {
              const st = normalizeStatus(t.status);
              return (
                <tr key={t.id} className="border-t border-cockpit-border">
                  <td className="px-3 py-2">{t.name}</td>
                  <td className="px-3 py-2 font-mono text-xs">{t.slug}</td>
                  <td className="px-3 py-2">{t.plan_name ?? t.plan_id ?? "—"}</td>
                  <td className="px-3 py-2">
                    <div className="flex flex-wrap gap-1">
                      {(t.core_codes ?? []).map((c) => (
                        <span key={c} className="rounded bg-cockpit-accent/15 px-1.5 text-xs">
                          {c}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-3 py-2 capitalize">{st}</td>
                  <td className="px-3 py-2 space-x-2">
                    <button type="button" className="text-cockpit-accent text-xs" onClick={() => { setEdit(t); setWizardOpen(true); }}>Editar</button>
                    {isPlatformSuperadmin ? (
                      <button
                        type="button"
                        className="text-xs"
                        onClick={async () => {
                          if (!confirm(`¿Cambiar estado de ${t.name}?`)) return;
                          await toggleTenantStatus(t.id, st === "active" ? "suspended" : "active");
                          void load();
                        }}
                      >
                        {st === "active" ? "Suspender" : "Reactivar"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <TenantWizardModal open={wizardOpen} tenant={edit} onClose={() => setWizardOpen(false)} onSaved={() => { setWizardOpen(false); void load(); }} />
    </div>
  );
}
