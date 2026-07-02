"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchConfigBanco, type ConfigBanco } from "@/lib/api/sic";
import { apiFetch } from "@/lib/api/fetch-client";
import { LoadingSic, ErrorSic } from "@/components/sic/EstadosSic";
import SICRegulatoryBadge from "@/components/sic/SICRegulatoryBadge";

type SICMultiTenantConfig = {
  tenant_id: string;
  institution_name: string;
  institution_type: string;
  regulatory_profile: string;
  country_code: string;
  currency: string;
  max_loan_amount: number;
  min_loan_amount: number;
  required_documents: string[];
  max_dti_ratio: number;
  max_ltv_ratio: number;
};

async function fetchSICMultiTenantConfig(
  tenantId: string
): Promise<SICMultiTenantConfig | null> {
  try {
    const res = await apiFetch("/api/v2/sic-mt/config", {
      headers: { "X-Tenant-ID": tenantId },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return (await res.json()) as SICMultiTenantConfig;
  } catch {
    return null;
  }
}

export default function SicConfiguracionPage() {
  const { tenantId } = useTenant();
  const { settings } = useTenant();
  const tenant = tenantId;

  const [config, setConfig] = useState<ConfigBanco | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mtConfig, setMtConfig] = useState<SICMultiTenantConfig | null>(null);
  const [mtLoading, setMtLoading] = useState(true);

  useEffect(() => {
    if (!tenant) return;
    let alive = true;
    fetchConfigBanco(tenant)
      .then((c) => {
        if (alive) setConfig(c ?? null);
      })
      .catch((e) => {
        if (alive) setError(e instanceof Error ? e.message : String(e));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant]);

  useEffect(() => {
    if (!tenant) return;
    let alive = true;
    setMtLoading(true);
    fetchSICMultiTenantConfig(tenant)
      .then((c) => {
        if (alive) setMtConfig(c);
      })
      .finally(() => {
        if (alive) setMtLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [tenant]);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando configuración" mensaje="Obteniendo parámetros por banco..." />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-700 text-zinc-100 m-0 mb-1">Configuración por Banco</h1>
      <p className="text-zinc-500 text-sm mb-6">Parámetros institucionales y white-label</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="space-y-6">
        <Seccion
          titulo="Configuración Multi-Tenant (v2)"
          desc="Perfil institucional y regulatorio gestionado por /api/v2/sic-mt"
        >
          {mtLoading ? (
            <p className="text-zinc-500 text-sm">Cargando configuración multi-tenant…</p>
          ) : !mtConfig ? (
            <p className="text-zinc-500 text-sm">
              Configuracion multi-tenant no disponible para este tenant
            </p>
          ) : (
            <div className="space-y-3 text-sm">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-zinc-200 font-600">{mtConfig.institution_name}</span>
                <SICRegulatoryBadge profile={mtConfig.regulatory_profile} size="sm" />
                <span className="text-zinc-500 text-xs">
                  {mtConfig.country_code} · {mtConfig.currency}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="text-zinc-500 text-xs">Monto máximo</div>
                  <div className="text-zinc-200">
                    {mtConfig.max_loan_amount.toLocaleString()} {mtConfig.currency}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs">Monto mínimo</div>
                  <div className="text-zinc-200">
                    {mtConfig.min_loan_amount.toLocaleString()} {mtConfig.currency}
                  </div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs">Máx. DTI</div>
                  <div className="text-zinc-200">{(mtConfig.max_dti_ratio * 100).toFixed(1)}%</div>
                </div>
                <div>
                  <div className="text-zinc-500 text-xs">Máx. LTV</div>
                  <div className="text-zinc-200">{(mtConfig.max_ltv_ratio * 100).toFixed(1)}%</div>
                </div>
              </div>
              <div>
                <div className="text-zinc-500 text-xs mb-1">Documentos requeridos</div>
                <div className="flex flex-wrap gap-2">
                  {mtConfig.required_documents.map((d) => (
                    <span
                      key={d}
                      className="inline-flex items-center rounded-full border border-zinc-700 bg-zinc-900/60 px-2 py-0.5 text-xs text-zinc-300"
                    >
                      {d}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Seccion>

        <Seccion titulo="Branding" desc="Logo e identidad corporativa">
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Nombre institución</label>
              <input
                type="text"
                defaultValue={config?.branding?.nombre_institucion ?? settings.name}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40"
                placeholder="Ej: Banco XYZ"
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs block mb-1">URL logo</label>
              <input
                type="text"
                defaultValue={config?.branding?.logo_url ?? ""}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-zinc-500 text-xs block mb-1">Color primario</label>
              <input
                type="text"
                defaultValue={config?.branding?.color_primario ?? settings.primaryColor}
                className="w-full bg-zinc-900/80 border border-zinc-700 rounded-lg px-3 py-2 text-zinc-200 focus-visible:outline focus-visible:ring-2 focus-visible:ring-violet-500/40"
                placeholder="#8b5cf6"
              />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Políticas" desc="Políticas de riesgo y crédito">
          <p className="text-zinc-500 text-sm">
            {config?.politicas
              ? "Políticas cargadas desde backend."
              : "Políticas configurables vía backend /api/v1/sic/configuracion."}
          </p>
        </Seccion>

        <Seccion titulo="Matrices de riesgo" desc="Umbrales y límites">
          <p className="text-zinc-500 text-sm">
            {config?.matrices_riesgo && (config.matrices_riesgo as unknown[]).length > 0
              ? `${(config.matrices_riesgo as unknown[]).length} matriz(es) configurada(s).`
              : "Matrices de riesgo configurables vía backend."}
          </p>
        </Seccion>

        <Seccion titulo="Reglas de decisión" desc="Reglas automáticas">
          <p className="text-zinc-500 text-sm">
            {config?.reglas_decision && (config.reglas_decision as unknown[]).length > 0
              ? `${(config.reglas_decision as unknown[]).length} regla(s) configurada(s).`
              : "Reglas de decisión configurables vía backend."}
          </p>
        </Seccion>

        <Seccion titulo="Roles internos" desc="Permisos por rol">
          {config?.roles_internos && config.roles_internos.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Permisos</th>
                </tr>
              </thead>
              <tbody>
                {config.roles_internos.map((r, i) => (
                  <tr key={i} className="border-b border-zinc-800/80">
                    <td className="px-4 py-2 text-zinc-300">{r.rol}</td>
                    <td className="px-4 py-2 text-zinc-400 text-xs">{r.permisos.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-zinc-500 text-sm">Roles configurables vía backend.</p>
          )}
        </Seccion>

        <Seccion titulo="Integraciones SSO" desc="Proveedores de identidad">
          {config?.integraciones_sso && config.integraciones_sso.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-500 text-xs">
                  <th className="px-4 py-2 text-left">Proveedor</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {config.integraciones_sso.map((s, i) => (
                  <tr key={i} className="border-b border-zinc-800/80">
                    <td className="px-4 py-2 text-zinc-300">{s.proveedor}</td>
                    <td className="px-4 py-2">
                      <span className={s.activo ? "text-emerald-400" : "text-zinc-500"}>
                        {s.activo ? "Activo" : "Inactivo"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-zinc-500 text-sm">Integraciones SSO configurables vía backend.</p>
          )}
        </Seccion>
      </div>
    </div>
  );
}

function Seccion({ titulo, desc, children }: { titulo: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4">
      <h2 className="text-zinc-300 font-600 text-sm m-0 mb-1">{titulo}</h2>
      <p className="text-zinc-500 text-xs m-0 mb-3">{desc}</p>
      {children}
    </div>
  );
}
