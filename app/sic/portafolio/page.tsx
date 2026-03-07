"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchPortafolioAnalytics, fetchExpedientes } from "@/lib/api/sic";
import type { PortafolioAnalytics } from "@/lib/api/sic";
import Link from "next/link";
import { LoadingSic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicPortafolioPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [analytics, setAnalytics] = useState<PortafolioAnalytics | null>(null);
  const [expedientes, setExpedientes] = useState<Awaited<ReturnType<typeof fetchExpedientes>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    Promise.all([
      fetchPortafolioAnalytics(tenant).catch(() => null),
      fetchExpedientes(tenant),
    ])
      .then(([a, exps]) => {
        if (alive) {
          setAnalytics(a ?? null);
          setExpedientes(exps ?? []);
        }
      })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  const a = analytics;
  const porEstado = a?.expedientes_por_estado ?? {};
  const estados = Object.entries(porEstado);
  const totalExps = expedientes.length;
  const aprobados = expedientes.filter((e) => e.estado_expediente === "APROBADO").length;
  const rechazados = expedientes.filter((e) => e.estado_expediente === "RECHAZADO").length;
  const conOverride = expedientes.filter((e) => e.decision_final_humana && e.decision_final_humana !== e.decision_actual).length;

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando analítica" mensaje="Obteniendo métricas de portafolio..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Analítica de Portafolio</h1>
      <p className="text-slate-500 text-sm mb-6">Métricas ejecutivas de riesgo crediticio</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4 mb-6">
        <KpiCard label="Expedientes" value={a?.expedientes_por_estado ? Object.values(porEstado).reduce((s, v) => s + v, 0) : totalExps} />
        <KpiCard label="Aprobados" value={a?.aprobados ?? aprobados} />
        <KpiCard label="Rechazados" value={a?.rechazados ?? rechazados} />
        <KpiCard label="Tasa overrides" value={totalExps > 0 ? `${((a?.tasa_overrides ?? (conOverride / totalExps)) * 100).toFixed(1)}%` : "—"} />
        <KpiCard label="Tiempo prom. (días)" value={a?.tiempo_promedio_dias ?? "—"} />
        <KpiCard label="Sesiones comité" value={a?.actividad_comite?.sesiones ?? "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
          <h2 className="text-slate-400 text-xs uppercase mb-3">Expedientes por estado</h2>
          {estados.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {estados.map(([est, n]) => (
                  <tr key={est} className="border-b border-slate-700/50">
                    <td className="py-2 text-slate-300">{est}</td>
                    <td className="py-2 text-slate-200 font-mono text-right">{n}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">Usando datos locales. El backend puede exponer /api/v1/sic/portafolio/analytics.</p>
          )}
        </div>
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
          <h2 className="text-slate-400 text-xs uppercase mb-3">Riesgos frecuentes</h2>
          {a?.riesgos_frecuentes && a.riesgos_frecuentes.length > 0 ? (
            <table className="w-full text-sm">
              <tbody>
                {a.riesgos_frecuentes.map((r, i) => (
                  <tr key={i} className="border-b border-slate-700/50">
                    <td className="py-2 text-slate-300">{r.riesgo}</td>
                    <td className="py-2 text-slate-200 font-mono text-right">{r.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="text-slate-500 text-sm">Sin datos de riesgos frecuentes.</p>
          )}
        </div>
      </div>

      <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
        <h2 className="text-slate-400 text-xs uppercase mb-3">Acceso rápido</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/sic/comite/sesiones" className="rounded px-3 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600">Comité</Link>
          <Link href="/sic/expedientes" className="rounded px-3 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600">Expedientes</Link>
          <Link href="/sic/reportes" className="rounded px-3 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600">Reportes</Link>
          <Link href="/sic/exportaciones" className="rounded px-3 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600">Exportaciones</Link>
        </div>
      </div>
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
      <dt className="text-slate-500 text-xs uppercase">{label}</dt>
      <dd className="text-slate-100 text-xl font-700 mt-1">{value}</dd>
    </div>
  );
}
