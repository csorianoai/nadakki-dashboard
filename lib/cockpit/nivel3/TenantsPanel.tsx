"use client";

import { useCallback, useEffect, useState } from "react";
import { PlatformApiError } from "@/lib/platformApi";
import { createTenant, fetchCoreRegistry, fetchPlans, fetchTenants, toggleTenantStatus } from "../api/tenantAdmin";
import { useCockpit } from "../context";
import { DemoPanelBadge } from "../components/DemoPanelBadge";
import { PanelFrame, PanelSkeleton } from "../components/PanelFrame";
import type { TenantBrandingPayload, TenantRecord } from "../types-platform";
import { validateBranding, validateSlug } from "../types-platform";
import { TenantWizardModal } from "./TenantWizardModal";

export function TenantsPanel() {
  const { isPlatformSuperadmin } = useCockpit();
  const [tenants, setTenants] = useState<TenantRecord[]>([]);
  const [isDemo, setIsDemo] = useState(false);
  const [loading, setLoading] = useState(true);
  const [wizardOpen, setWizardOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<TenantRecord | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetchTenants();
    setTenants(res.tenants);
    setIsDemo(res.isDemo);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const onToggle = async (t: TenantRecord) => {
    if (!isPlatformSuperadmin) return;
    const next = t.status === "active" ? "suspended" : "active";
    const ok = window.confirm(`¿${next === "suspended" ? "Suspender" : "Reactivar"} tenant ${t.name}?`);
    if (!ok) return;
    try {
      await toggleTenantStatus(t.id, next);
      void load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <PanelFrame title="Tenants" badge={isDemo ? <DemoPanelBadge /> : undefined}>
      {isPlatformSuperadmin ? (
        <button type="button" className="ch-btn ch-btn-persona ch-btn-sm mb-3" onClick={() => { setEditTarget(null); setWizardOpen(true); }}>
          Crear tenant
        </button>
      ) : null}
      {loading ? <PanelSkeleton rows={4} /> : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-[var(--ch-text-3)] border-b border-[var(--ch-line)]">
                <th className="py-2 text-left">Nombre</th>
                <th className="py-2 text-left">Slug</th>
                <th className="py-2 text-left">Plan</th>
                <th className="py-2 text-left">Cores</th>
                <th className="py-2 text-left">Estado</th>
                <th className="py-2 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map((t) => (
                <tr key={t.id} className="border-b border-[var(--ch-line)]">
                  <td className="py-2">{t.name}</td>
                  <td className="py-2 font-mono text-xs">{t.slug}</td>
                  <td className="py-2">{t.plan_name ?? t.plan_id ?? "—"}</td>
                  <td className="py-2">
                    <div className="flex flex-wrap gap-1">
                      {(t.core_codes ?? []).map((c) => (
                        <span key={c} className="rounded bg-[var(--ch-surface-3)] px-1.5 py-0.5 text-xs">{c}</span>
                      ))}
                    </div>
                  </td>
                  <td className="py-2">{t.status}</td>
                  <td className="py-2 space-x-2">
                    <button type="button" className="text-xs text-[var(--ch-persona)]" onClick={() => { setEditTarget(t); setWizardOpen(true); }}>Editar</button>
                    {isPlatformSuperadmin ? (
                      <button type="button" className="text-xs" onClick={() => void onToggle(t)}>
                        {t.status === "active" ? "Suspender" : "Reactivar"}
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <TenantWizardModal
        open={wizardOpen}
        tenant={editTarget}
        onClose={() => setWizardOpen(false)}
        onSaved={() => { setWizardOpen(false); void load(); }}
      />
    </PanelFrame>
  );
}

export async function submitTenantWizard(data: {
  name: string;
  slug: string;
  locale: string;
  currency: string;
  branding: TenantBrandingPayload;
  plan_id: string;
  core_codes: string[];
  id?: string;
}): Promise<void> {
  const slugErr = validateSlug(data.slug);
  if (slugErr) throw new Error(slugErr);
  const brandErr = validateBranding(data.branding);
  if (brandErr) throw new Error(brandErr);
  try {
    if (data.id) {
      await import("../api/tenantAdmin").then((m) => m.updateTenant(data.id!, data));
    } else {
      await createTenant(data);
    }
  } catch (e) {
    if (e instanceof PlatformApiError && e.status === 409) {
      throw new Error("Este slug ya está en uso");
    }
    if (e instanceof PlatformApiError && e.status === 422) {
      throw new Error(e.detail);
    }
    throw e;
  }
}
