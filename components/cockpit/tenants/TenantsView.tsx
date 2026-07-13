"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { MoreVertical } from "lucide-react";
import { DataTruthBadge } from "@/components/credit-hub/honesty/DataTruthBadge";
import { AdminPanelLink } from "@/components/cockpit/AdminPanelLink";
import { fetchTenants, toggleTenantStatus } from "@/lib/cockpit/api/tenantAdmin";
import {
  ADMIN_TENANT_CREATE_URL,
  adminTenantConfigUrl,
  isCockpitConsolidationEnabled,
} from "@/lib/cockpit/consolidation";
import { useCockpit } from "@/lib/cockpit/context";
import { normalizeStatus } from "@/lib/cockpit/normalize";
import type { TenantRecord } from "@/lib/cockpit/types-platform";
import { TenantWizardModal } from "@/components/cockpit/tenants/TenantWizardModal";

function TenantRowMenu({ tenant, onClose }: { tenant: TenantRecord; onClose: () => void }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [onClose]);

  return (
    <div ref={ref} className="absolute right-0 top-full z-20 mt-1 min-w-[11rem] rounded-lg border border-cockpit-border bg-cockpit-surface py-1 shadow-lg">
      <Link
        href={`/cockpit/tenants/${tenant.id}`}
        className="block px-3 py-2 text-xs text-cockpit-text hover:bg-cockpit-border/40"
        onClick={onClose}
      >
        Ver detalle
      </Link>
      <a
        href={adminTenantConfigUrl(tenant.id)}
        target="_blank"
        rel="noopener noreferrer"
        className="block px-3 py-2 text-xs text-cockpit-muted hover:border-cockpit-accent hover:bg-cockpit-border/40 hover:text-cockpit-accent"
        onClick={onClose}
      >
        Editar en Panel admin →
      </a>
    </div>
  );
}

export function TenantsView() {
  const consolidation = isCockpitConsolidationEnabled();
  const { isPlatformSuperadmin } = useCockpit();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [edit, setEdit] = useState<TenantRecord | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);

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
          consolidation ? (
            <AdminPanelLink href={ADMIN_TENANT_CREATE_URL}>Crear en Panel admin →</AdminPanelLink>
          ) : (
            <button
              type="button"
              className="rounded-lg bg-cockpit-accent px-4 py-2 text-sm font-medium text-cockpit-bg"
              onClick={() => {
                setEdit(null);
                setWizardOpen(true);
              }}
            >
              Nuevo tenant
            </button>
          )
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
                  <td className="px-3 py-2">
                    {consolidation ? (
                      <Link href={`/cockpit/tenants/${t.id}`} className="text-cockpit-accent hover:underline">
                        {t.name}
                      </Link>
                    ) : (
                      t.name
                    )}
                  </td>
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
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      {consolidation ? (
                        <div className="relative">
                          <button
                            type="button"
                            className="rounded p-1 text-cockpit-muted hover:bg-cockpit-border/40 hover:text-cockpit-text"
                            aria-label="Más acciones"
                            onClick={() => setMenuId(menuId === t.id ? null : t.id)}
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {menuId === t.id ? (
                            <TenantRowMenu tenant={t} onClose={() => setMenuId(null)} />
                          ) : null}
                        </div>
                      ) : (
                        <button
                          type="button"
                          className="text-xs text-cockpit-accent"
                          onClick={() => {
                            setEdit(t);
                            setWizardOpen(true);
                          }}
                        >
                          Editar
                        </button>
                      )}
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
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {!consolidation ? (
        <TenantWizardModal
          open={wizardOpen}
          tenant={edit}
          onClose={() => setWizardOpen(false)}
          onSaved={() => {
            setWizardOpen(false);
            void load();
          }}
        />
      ) : null}
    </div>
  );
}
