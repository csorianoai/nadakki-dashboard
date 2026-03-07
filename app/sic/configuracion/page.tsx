"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchConfigBanco, type ConfigBanco } from "@/lib/api/sic";
import { LoadingSic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicConfiguracionPage() {
  const { tenantId } = useTenant();
  const { settings } = useTenant();
  const tenant = tenantId || "credicefi";
  const [config, setConfig] = useState<ConfigBanco | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchConfigBanco(tenant)
      .then((c) => { if (alive) setConfig(c ?? null); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
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
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Configuración por Banco</h1>
      <p className="text-slate-500 text-sm mb-6">Parámetros institucionales y white-label</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="space-y-6">
        <Seccion titulo="Branding" desc="Logo e identidad corporativa">
          <div className="space-y-3 text-sm">
            <div>
              <label className="text-slate-500 text-xs block mb-1">Nombre institución</label>
              <input
                type="text"
                defaultValue={config?.branding?.nombre_institucion ?? settings.name}
                className="w-full bg-slate-800/80 border border-slate-600 rounded px-3 py-2 text-slate-200"
                placeholder="Ej: Banco XYZ"
              />
            </div>
            <div>
              <label className="text-slate-500 text-xs block mb-1">URL logo</label>
              <input
                type="text"
                defaultValue={config?.branding?.logo_url ?? ""}
                className="w-full bg-slate-800/80 border border-slate-600 rounded px-3 py-2 text-slate-200"
                placeholder="https://..."
              />
            </div>
            <div>
              <label className="text-slate-500 text-xs block mb-1">Color primario</label>
              <input
                type="text"
                defaultValue={config?.branding?.color_primario ?? settings.primaryColor}
                className="w-full bg-slate-800/80 border border-slate-600 rounded px-3 py-2 text-slate-200"
                placeholder="#8b5cf6"
              />
            </div>
          </div>
        </Seccion>

        <Seccion titulo="Políticas" desc="Políticas de riesgo y crédito">
          <p className="text-slate-500 text-sm">
            {config?.politicas ? "Políticas cargadas desde backend." : "Políticas configurables vía backend /api/v1/sic/configuracion."}
          </p>
        </Seccion>

        <Seccion titulo="Matrices de riesgo" desc="Umbrales y límites">
          <p className="text-slate-500 text-sm">
            {config?.matrices_riesgo && (config.matrices_riesgo as unknown[]).length > 0
              ? `${(config.matrices_riesgo as unknown[]).length} matriz(es) configurada(s).`
              : "Matrices de riesgo configurables vía backend."}
          </p>
        </Seccion>

        <Seccion titulo="Reglas de decisión" desc="Reglas automáticas">
          <p className="text-slate-500 text-sm">
            {config?.reglas_decision && (config.reglas_decision as unknown[]).length > 0
              ? `${(config.reglas_decision as unknown[]).length} regla(s) configurada(s).`
              : "Reglas de decisión configurables vía backend."}
          </p>
        </Seccion>

        <Seccion titulo="Roles internos" desc="Permisos por rol">
          {config?.roles_internos && config.roles_internos.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left">Rol</th>
                  <th className="px-4 py-2 text-left">Permisos</th>
                </tr>
              </thead>
              <tbody>
                {config.roles_internos.map((r, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="px-4 py-2 text-slate-300">{r.rol}</td>
                    <td className="px-4 py-2 text-slate-400 text-xs">{r.permisos.join(", ")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">Roles configurables vía backend.</p>
          )}
        </Seccion>

        <Seccion titulo="Integraciones SSO" desc="Proveedores de identidad">
          {config?.integraciones_sso && config.integraciones_sso.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left">Proveedor</th>
                  <th className="px-4 py-2 text-left">Estado</th>
                </tr>
              </thead>
              <tbody>
                {config.integraciones_sso.map((s, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="px-4 py-2 text-slate-300">{s.proveedor}</td>
                    <td className="px-4 py-2">
                      <span className={s.activo ? "text-emerald-400" : "text-slate-500"}>{s.activo ? "Activo" : "Inactivo"}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">Integraciones SSO configurables vía backend.</p>
          )}
        </Seccion>
      </div>
    </div>
  );
}

function Seccion({ titulo, desc, children }: { titulo: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <h2 className="text-slate-300 font-600 text-sm m-0 mb-1">{titulo}</h2>
      <p className="text-slate-500 text-xs m-0 mb-3">{desc}</p>
      {children}
    </div>
  );
}
