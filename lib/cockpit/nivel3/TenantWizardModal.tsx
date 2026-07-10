"use client";

import { useEffect, useState } from "react";
import { fetchCoreRegistry, fetchPlans } from "../api/tenantAdmin";
import type { TenantBrandingPayload, TenantRecord } from "../types-platform";
import { submitTenantWizard } from "./TenantsPanel";

interface Props {
  open: boolean;
  tenant: TenantRecord | null;
  onClose: () => void;
  onSaved: () => void;
}

export function TenantWizardModal({ open, tenant, onClose, onSaved }: Props) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [cores, setCores] = useState<Array<{ code: string; display_name: string }>>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    locale: "es-DO",
    currency: "DOP",
    branding: { display_name: "", logo_url: null as string | null, brand_primary: "#2563eb" } as TenantBrandingPayload,
    plan_id: "",
    core_codes: [] as string[],
  });

  useEffect(() => {
    if (!open) return;
    setStep(1);
    setError(null);
    if (tenant) {
      setForm({
        name: tenant.name,
        slug: tenant.slug,
        locale: tenant.locale,
        currency: tenant.currency,
        branding: tenant.branding ?? { display_name: tenant.name, logo_url: null, brand_primary: "#2563eb" },
        plan_id: tenant.plan_id ?? "",
        core_codes: tenant.core_codes ?? [],
      });
    } else {
      setForm({
        name: "",
        slug: "",
        locale: "es-DO",
        currency: "DOP",
        branding: { display_name: "", logo_url: null, brand_primary: "#2563eb" },
        plan_id: "",
        core_codes: [],
      });
    }
    void fetchPlans().then(setPlans);
    void fetchCoreRegistry().then(setCores);
  }, [open, tenant]);

  if (!open) return null;

  const submit = async () => {
    setError(null);
    try {
      await submitTenantWizard({ ...form, id: tenant?.id });
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog">
      <div className="ch-card max-w-lg w-full p-4" style={{ maxHeight: "90vh", overflow: "auto" }}>
        <h3 className="font-semibold mb-2">{tenant ? "Editar tenant" : "Crear tenant"} — Paso {step}/3</h3>
        {error ? <p className="text-sm text-[var(--ch-danger-text)] mb-2">{error}</p> : null}
        {step === 1 ? (
          <div className="space-y-2 text-sm">
            <input className="ch-input w-full" placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, branding: { ...p.branding, display_name: e.target.value } }))} />
            <input className="ch-input w-full" placeholder="slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))} />
            <input className="ch-input w-full" placeholder="locale" value={form.locale} onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))} />
            <input className="ch-input w-full" placeholder="currency" value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))} />
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-2 text-sm">
            <input className="ch-input w-full" placeholder="display_name" value={form.branding.display_name} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, display_name: e.target.value } }))} />
            <input className="ch-input w-full" placeholder="logo_url" value={form.branding.logo_url ?? ""} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, logo_url: e.target.value || null } }))} />
            <input className="ch-input w-full" placeholder="#RRGGBB" value={form.branding.brand_primary} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, brand_primary: e.target.value } }))} />
            <div className="flex items-center gap-2 rounded border p-2" style={{ borderColor: form.branding.brand_primary }}>
              <span className="h-6 w-6 rounded" style={{ background: form.branding.brand_primary }} />
              <span>{form.branding.display_name || "Preview"}</span>
              {form.branding.logo_url ? <img src={form.branding.logo_url} alt="" className="h-6" /> : null}
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-2 text-sm">
            <select className="ch-input w-full" value={form.plan_id} onChange={(e) => setForm((p) => ({ ...p, plan_id: e.target.value }))}>
              <option value="">Seleccionar plan</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <div className="space-y-1">
              {cores.map((c) => (
                <label key={c.code} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.core_codes.includes(c.code)}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        core_codes: e.target.checked ? [...p.core_codes, c.code] : p.core_codes.filter((x) => x !== c.code),
                      }))
                    }
                  />
                  {c.display_name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={onClose}>Cancelar</button>
          {step > 1 ? <button type="button" className="ch-btn ch-btn-secondary ch-btn-sm" onClick={() => setStep((s) => s - 1)}>Atrás</button> : null}
          {step < 3 ? (
            <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" onClick={() => setStep((s) => s + 1)}>Siguiente</button>
          ) : (
            <button type="button" className="ch-btn ch-btn-persona ch-btn-sm" onClick={() => void submit()}>Guardar</button>
          )}
        </div>
      </div>
    </div>
  );
}
