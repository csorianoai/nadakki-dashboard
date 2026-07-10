"use client";

import { useEffect, useState } from "react";
import { fetchCoreRegistry, fetchPlans } from "@/lib/cockpit/api/tenantAdmin";
import { submitTenantWizard } from "@/lib/cockpit/tenant-wizard";
import type { TenantBrandingPayload, TenantRecord } from "@/lib/cockpit/types-platform";

const inputCls =
  "w-full rounded-lg border border-cockpit-border bg-cockpit-bg px-3 py-2 text-sm text-cockpit-text";

export function TenantWizardModal({
  open,
  tenant,
  onClose,
  onSaved,
}: {
  open: boolean;
  tenant: TenantRecord | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [plans, setPlans] = useState<Array<{ id: string; name: string }>>([]);
  const [cores, setCores] = useState<Array<{ code: string; display_name: string; color_hex?: string }>>([]);
  const [form, setForm] = useState({
    name: "",
    slug: "",
    locale: "es-DO",
    currency: "DOP",
    branding: { display_name: "", logo_url: null as string | null, brand_primary: "#a78bfa" } as TenantBrandingPayload,
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
        branding: tenant.branding ?? { display_name: tenant.name, logo_url: null, brand_primary: "#a78bfa" },
        plan_id: tenant.plan_id ?? "",
        core_codes: tenant.core_codes ?? [],
      });
    }
    void fetchPlans().then(setPlans);
    void fetchCoreRegistry().then(setCores);
  }, [open, tenant]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" role="dialog">
      <div className="max-h-[90vh] w-full max-w-lg overflow-auto rounded-xl border border-cockpit-border bg-cockpit-surface p-4">
        <h3 className="mb-2 font-semibold">
          {tenant ? "Editar tenant" : "Crear tenant"} — Paso {step}/3
        </h3>
        {error ? <p className="mb-2 text-sm text-cockpit-err">{error}</p> : null}
        {step === 1 ? (
          <div className="space-y-2">
            <input className={inputCls} placeholder="Nombre" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value, branding: { ...p.branding, display_name: e.target.value } }))} />
            <input className={inputCls} placeholder="slug" value={form.slug} onChange={(e) => setForm((p) => ({ ...p, slug: e.target.value.toLowerCase() }))} />
            <select className={inputCls} value={form.locale} onChange={(e) => setForm((p) => ({ ...p, locale: e.target.value }))}>
              <option value="es-DO">es-DO</option>
              <option value="es-MX">es-MX</option>
            </select>
            <select className={inputCls} value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value }))}>
              <option value="DOP">DOP</option>
              <option value="USD">USD</option>
            </select>
          </div>
        ) : null}
        {step === 2 ? (
          <div className="space-y-2">
            <input type="color" className="h-10 w-full" value={form.branding.brand_primary} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, brand_primary: e.target.value } }))} />
            <input className={inputCls} placeholder="logo_url" value={form.branding.logo_url ?? ""} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, logo_url: e.target.value || null } }))} />
            <input className={inputCls} placeholder="display_name" value={form.branding.display_name} onChange={(e) => setForm((p) => ({ ...p, branding: { ...p.branding, display_name: e.target.value } }))} />
            <div className="flex items-center gap-2 rounded-lg border border-cockpit-border p-3" style={{ borderLeftColor: form.branding.brand_primary, borderLeftWidth: 4 }}>
              <span className="h-8 w-8 rounded" style={{ background: form.branding.brand_primary }} />
              <span>{form.branding.display_name || "Preview"}</span>
            </div>
          </div>
        ) : null}
        {step === 3 ? (
          <div className="space-y-3">
            {plans.map((p) => (
              <label key={p.id} className={`block cursor-pointer rounded-lg border p-3 ${form.plan_id === p.id ? "border-cockpit-accent" : "border-cockpit-border"}`}>
                <input type="radio" className="mr-2" checked={form.plan_id === p.id} onChange={() => setForm((f) => ({ ...f, plan_id: p.id }))} />
                {p.name}
              </label>
            ))}
            <div className="space-y-1">
              {cores.map((c) => (
                <label key={c.code} className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.core_codes.includes(c.code)}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        core_codes: e.target.checked ? [...f.core_codes, c.code] : f.core_codes.filter((x) => x !== c.code),
                      }))
                    }
                  />
                  <span className="h-2 w-2 rounded-full" style={{ background: c.color_hex ?? "#a78bfa" }} />
                  {c.display_name}
                </label>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="rounded border border-cockpit-border px-3 py-1 text-sm" onClick={onClose}>Cancelar</button>
          {step > 1 ? <button type="button" className="rounded border border-cockpit-border px-3 py-1 text-sm" onClick={() => setStep((s) => s - 1)}>Atrás</button> : null}
          {step < 3 ? (
            <button type="button" className="rounded bg-cockpit-accent px-3 py-1 text-sm text-cockpit-bg" onClick={() => setStep((s) => s + 1)}>Siguiente</button>
          ) : (
            <button
              type="button"
              className="rounded bg-cockpit-accent px-3 py-1 text-sm text-cockpit-bg"
              onClick={() =>
                void submitTenantWizard({ ...form, id: tenant?.id })
                  .then(onSaved)
                  .catch((e) => setError(e instanceof Error ? e.message : "Error"))
              }
            >
              Guardar
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
