"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { fetchExpedientes, type Expediente, type EstadoExpediente } from "@/lib/api/sic";

const ESTADOS_BADGE: Record<string, string> = {
  RECIBIDO: "bg-slate-500/30 text-slate-300",
  EN_VALIDACION: "bg-amber-500/30 text-amber-300",
  EN_ANALISIS_IA: "bg-blue-500/30 text-blue-300",
  EN_REVISION_ANALISTA: "bg-cyan-500/30 text-cyan-300",
  EN_COMITE: "bg-violet-500/30 text-violet-300",
  REQUIERE_INFORMACION: "bg-orange-500/30 text-orange-300",
  APROBADO: "bg-emerald-500/30 text-emerald-300",
  RECHAZADO: "bg-red-500/30 text-red-300",
  ARCHIVADO: "bg-slate-600/30 text-slate-400",
  REABIERTO: "bg-cyan-500/30 text-cyan-300",
};

export default function SicExpedientesPage() {
  const { tenantId } = useTenant();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenant = tenantId || "credicefi";

  useEffect(() => {
    let alive = true;
    fetchExpedientes(tenant)
      .then((list) => { if (alive) setExpedientes(list); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando expedientes…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Expedientes</h1>
      <p className="text-slate-500 text-sm mb-6">Listado completo de expedientes crediticios</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {expedientes.length === 0 && !error ? (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-12 text-center">
          <p className="text-slate-400 text-sm">No hay expedientes</p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80">
                <th className="px-4 py-3 text-slate-400 font-600">Expediente</th>
                <th className="px-4 py-3 text-slate-400 font-600">Estado</th>
                <th className="px-4 py-3 text-slate-400 font-600">Cliente</th>
                <th className="px-4 py-3 text-slate-400 font-600">Decisión</th>
                <th className="px-4 py-3 text-slate-400 font-600"></th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((e) => (
                <tr key={e.expediente_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="px-4 py-3 font-mono text-cyan-300">{e.expediente_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ESTADOS_BADGE[(e.estado_expediente as EstadoExpediente) ?? ""] ?? "bg-slate-600/30 text-slate-400"
                      }`}
                    >
                      {e.estado_expediente ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{e.referencia_cliente ?? "—"}</td>
                  <td className="px-4 py-3 text-slate-300">{e.decision_actual ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link href={`/sic/expedientes/${e.expediente_id}`} className="text-cyan-400 hover:underline text-xs">
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
