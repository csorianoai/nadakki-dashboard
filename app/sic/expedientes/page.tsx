"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import Link from "next/link";
import { fetchExpedientes, type Expediente, type EstadoExpediente } from "@/lib/api/sic";

const ESTADOS_BADGE: Record<string, string> = {
  RECIBIDO: "bg-zinc-600/30 text-zinc-300",
  EN_VALIDACION: "bg-amber-500/30 text-amber-300",
  EN_ANALISIS_IA: "bg-violet-500/30 text-violet-300",
  EN_REVISION_ANALISTA: "bg-indigo-500/30 text-indigo-300",
  EN_COMITE: "bg-violet-600/30 text-violet-200",
  REQUIERE_INFORMACION: "bg-orange-500/30 text-orange-300",
  APROBADO: "bg-emerald-500/30 text-emerald-300",
  RECHAZADO: "bg-red-500/30 text-red-300",
  ARCHIVADO: "bg-zinc-700/30 text-zinc-400",
  REABIERTO: "bg-indigo-500/30 text-indigo-300",
};

const BTN_PRIMARY =
  "shrink-0 inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-2 text-sm font-600 text-white shadow-sm transition-all hover:brightness-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-400";

export default function SicExpedientesPage() {
  const { tenantId } = useTenant();
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const tenant = tenantId?.trim() ?? "";

  useEffect(() => {
    let alive = true;
    if (!tenant) {
      setExpedientes([]);
      setLoading(false);
      setError("No hay tenant activo");
      return () => {
        alive = false;
      };
    }
    setError(null);
    fetchExpedientes(tenant)
      .then((list) => {
        if (alive) setExpedientes(list);
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[40vh]">
        <div className="text-zinc-400 text-sm">Cargando expedientes…</div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-6">
        <div>
          <h1 className="text-xl font-700 text-zinc-100 m-0 mb-1">Expedientes</h1>
          <p className="text-zinc-500 text-sm m-0">Listado completo de expedientes crediticios</p>
        </div>
        <Link href="/sic/nuevo-analisis" className={BTN_PRIMARY}>
          + Nuevo
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      {!error && expedientes.length === 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-12 text-center space-y-4">
          <p className="text-zinc-400 text-sm m-0">No hay expedientes todavía.</p>
          <Link href="/sic/nuevo-analisis" className={BTN_PRIMARY}>
            Crear primer análisis
          </Link>
        </div>
      ) : expedientes.length > 0 ? (
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="px-4 py-3 text-zinc-500 font-600">Expediente</th>
                <th className="px-4 py-3 text-zinc-500 font-600">Estado</th>
                <th className="px-4 py-3 text-zinc-500 font-600">Cliente</th>
                <th className="px-4 py-3 text-zinc-500 font-600">Decisión</th>
                <th className="px-4 py-3 text-zinc-500 font-600"></th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((e) => (
                <tr key={e.expediente_id} className="border-b border-zinc-800/80 hover:bg-zinc-900/80">
                  <td className="px-4 py-3 font-mono text-violet-300">{e.expediente_id}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs font-medium ${
                        ESTADOS_BADGE[(e.estado_expediente as EstadoExpediente) ?? ""] ??
                        "bg-zinc-700/30 text-zinc-400"
                      }`}
                    >
                      {e.estado_expediente ?? "—"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-300">{e.referencia_cliente ?? "—"}</td>
                  <td className="px-4 py-3 text-zinc-300">{e.decision_actual ?? "—"}</td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/sic/expedientes/${e.expediente_id}`}
                      className="text-violet-400 hover:underline text-xs"
                    >
                      Ver
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
