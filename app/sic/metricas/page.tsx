"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchMetricasEjecutivas,
  fetchExpedientes,
  type MetricasEjecutivas,
} from "@/lib/api/sic";
import { LoadingSic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicMetricasPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [metricas, setMetricas] = useState<MetricasEjecutivas | null>(null);
  const [expedientes, setExpedientes] = useState<Awaited<ReturnType<typeof fetchExpedientes>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchMetricasEjecutivas(tenant).catch(() => null),
      fetchExpedientes(tenant),
    ])
      .then(([m, exps]) => {
        if (alive) {
          setMetricas(m ?? null);
          setExpedientes(exps ?? []);
        }
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  const m = metricas;
  const porEstado = m?.expedientes_por_estado ?? Object.entries(
    expedientes.reduce<Record<string, number>>((acc, e) => {
      const est = e.estado_expediente ?? "—";
      acc[est] = (acc[est] ?? 0) + 1;
      return acc;
    }, {})
  ).reduce((o, [k, v]) => ({ ...o, [k]: v }), {});

  const aprobados = m?.aprobados ?? expedientes.filter((e) => e.estado_expediente === "APROBADO").length;
  const rechazados = m?.rechazados ?? expedientes.filter((e) => e.estado_expediente === "RECHAZADO").length;
  const conOverride = expedientes.filter((e) => e.decision_final_humana && e.decision_final_humana !== e.decision_actual).length;
  const total = expedientes.length;
  const tasaOverride = total > 0 ? ((m?.tasa_overrides ?? conOverride / total) * 100).toFixed(1) : "—";

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando métricas" mensaje="Obteniendo datos ejecutivos..." />
      </div>
    );
  }

  return (
    <div className="p-4 min-h-screen bg-[#080c14]">
      <div className="mb-4">
        <h1 className="text-lg font-700 text-slate-100 m-0">Panel de Métricas Ejecutivas</h1>
        <p className="text-slate-500 text-xs m-0 mt-0.5">Rendimiento operativo · SIC</p>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-4">
        <MetricaCard label="Expedientes total" value={total} />
        <MetricaCard label="Aprobados" value={aprobados} />
        <MetricaCard label="Rechazados" value={rechazados} />
        <MetricaCard label="Tasa overrides %" value={tasaOverride} />
        <MetricaCard label="Tiempo prom. decisión (h)" value={m?.tiempo_promedio_decision_horas ?? "—"} />
        <MetricaCard label="Overrides" value={m?.total_overrides ?? conOverride} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="rounded border border-slate-700/60 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/60 bg-slate-800/40">
            <h2 className="text-slate-300 text-xs font-600 uppercase">Expedientes por estado</h2>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                <th className="px-4 py-2 text-left font-600">Estado</th>
                <th className="px-4 py-2 text-right font-600">Cantidad</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(porEstado).map(([est, n]) => (
                <tr key={est} className="border-b border-slate-700/40 hover:bg-slate-800/30">
                  <td className="px-4 py-2 text-slate-300">{est}</td>
                  <td className="px-4 py-2 text-slate-200 font-mono text-right">{String(n)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded border border-slate-700/60 bg-slate-900/60 overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/60 bg-slate-800/40">
            <h2 className="text-slate-300 text-xs font-600 uppercase">Productividad por analista</h2>
          </div>
          {m?.productividad_analista && m.productividad_analista.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left font-600">Analista</th>
                  <th className="px-4 py-2 text-right font-600">Expedientes</th>
                  <th className="px-4 py-2 text-right font-600">Resueltos</th>
                </tr>
              </thead>
              <tbody>
                {m.productividad_analista.map((a, i) => (
                  <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-300">{a.analista}</td>
                    <td className="px-4 py-2 text-slate-200 font-mono text-right">{a.expedientes}</td>
                    <td className="px-4 py-2 text-slate-200 font-mono text-right">{a.resueltos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-slate-500 text-xs">Datos de productividad disponibles vía backend /api/v1/sic/metricas</p>
          )}
        </div>

        <div className="rounded border border-slate-700/60 bg-slate-900/60 overflow-hidden lg:col-span-2">
          <div className="px-4 py-2 border-b border-slate-700/60 bg-slate-800/40">
            <h2 className="text-slate-300 text-xs font-600 uppercase">Uso por rol</h2>
          </div>
          {m?.uso_por_rol && m.uso_por_rol.length > 0 ? (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-700/60 text-slate-500 text-xs">
                  <th className="px-4 py-2 text-left font-600">Rol</th>
                  <th className="px-4 py-2 text-right font-600">Sesiones</th>
                  <th className="px-4 py-2 text-right font-600">Accesos</th>
                </tr>
              </thead>
              <tbody>
                {m.uso_por_rol.map((r, i) => (
                  <tr key={i} className="border-b border-slate-700/40 hover:bg-slate-800/30">
                    <td className="px-4 py-2 text-slate-300">{r.rol}</td>
                    <td className="px-4 py-2 text-slate-200 font-mono text-right">{r.sesiones}</td>
                    <td className="px-4 py-2 text-slate-200 font-mono text-right">{r.accesos}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="p-4 text-slate-500 text-xs">Datos de uso por rol disponibles vía backend.</p>
          )}
        </div>
      </div>

      {m?.rendimiento_operativo && (
        <div className="mt-4 rounded border border-slate-700/60 bg-slate-900/60 p-4">
          <h2 className="text-slate-300 text-xs font-600 uppercase mb-3">Rendimiento operativo</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <dt className="text-slate-500 text-xs">Uptime</dt>
              <dd className="text-slate-200 font-mono">{m.rendimiento_operativo.uptime_pct ?? "—"}%</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Latencia P50</dt>
              <dd className="text-slate-200 font-mono">{m.rendimiento_operativo.latencia_p50_ms ?? "—"} ms</dd>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricaCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded border border-slate-700/60 bg-slate-900/60 p-3">
      <dt className="text-slate-500 text-[10px] uppercase">{label}</dt>
      <dd className="text-slate-100 text-lg font-700 mt-1 font-mono">{value}</dd>
    </div>
  );
}
