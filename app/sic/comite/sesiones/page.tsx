"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchSesionesComite, type SesionComite } from "@/lib/api/sic";
import Link from "next/link";
import { LoadingSic, EmptySic, ErrorSic } from "@/components/sic/EstadosSic";

const ESTADO_BADGE: Record<string, string> = {
  programada: "bg-slate-500/30 text-slate-300",
  abierta: "bg-cyan-500/30 text-cyan-300",
  cerrada: "bg-emerald-500/30 text-emerald-300",
  pospuesta: "bg-amber-500/30 text-amber-300",
};

export default function SicComiteSesionesPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [sesiones, setSesiones] = useState<SesionComite[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    fetchSesionesComite(tenant, 50)
      .then((list) => { if (alive) setSesiones(list); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando sesiones" mensaje="Obteniendo sesiones de comité..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/sic/comite" className="text-slate-500 hover:text-slate-300 text-xs mb-1 inline-block">← Comité</Link>
          <h1 className="text-xl font-700 text-slate-100 m-0">Sesiones de Comité</h1>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        {sesiones.length === 0 ? (
          <EmptySic titulo="Sin sesiones" mensaje="No hay sesiones de comité registradas.">
            <Link href="/sic/comite" className="text-cyan-400 hover:underline text-sm">Ir a Comité</Link>
          </EmptySic>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-600">Sesión</th>
                <th className="p-3 font-600">Fecha</th>
                <th className="p-3 font-600">Estado</th>
                <th className="p-3 font-600">Expedientes</th>
                <th className="p-3 font-600">Creado por</th>
                <th className="p-3 font-600"></th>
              </tr>
            </thead>
            <tbody>
              {sesiones.map((s) => (
                <tr key={s.sesion_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3 font-mono text-cyan-300">{s.sesion_id}</td>
                  <td className="p-3 text-slate-300">{s.fecha_sesion ?? "—"}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-xs ${ESTADO_BADGE[s.estado_sesion ?? ""] ?? "bg-slate-600/30 text-slate-400"}`}>
                      {s.estado_sesion ?? "—"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{s.expedientes_count ?? "—"}</td>
                  <td className="p-3 text-slate-400 text-xs">{s.creado_por ?? "—"}</td>
                  <td className="p-3">
                    <Link href={`/sic/comite/sesiones/${s.sesion_id}`} className="text-cyan-400 hover:underline text-xs">Abrir</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
