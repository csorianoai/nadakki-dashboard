"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchAuditoriaAcceso, type EventoAcceso } from "@/lib/api/sic";
import Link from "next/link";
import { LoadingSic, EmptySic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicAuditoriaAccesoPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [eventos, setEventos] = useState<EventoAcceso[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filtroSensibles, setFiltroSensibles] = useState(false);

  useEffect(() => {
    let alive = true;
    fetchAuditoriaAcceso(tenant, 200)
      .then((list) => { if (alive) setEventos(list); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant]);

  const filtrados = filtroSensibles ? eventos.filter((e) => e.datos_sensibles) : eventos;

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando auditoría de acceso" mensaje="Obteniendo eventos..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Auditoría de Acceso</h1>
      <p className="text-slate-500 text-sm mb-6">Usuarios activos, accesos recientes y acciones críticas</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="mb-4 flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-slate-400">
          <input
            type="checkbox"
            checked={filtroSensibles}
            onChange={(e) => setFiltroSensibles(e.target.checked)}
            className="rounded border-slate-600 bg-slate-800"
          />
          Solo datos sensibles
        </label>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptySic
            titulo="Sin eventos de acceso"
            mensaje={filtroSensibles ? "No hay accesos a datos sensibles." : "Los eventos aparecerán cuando el backend exponga /api/v1/sic/auditoria-acceso."}
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-600">Fecha</th>
                <th className="p-3 font-600">Usuario</th>
                <th className="p-3 font-600">Rol</th>
                <th className="p-3 font-600">Acción</th>
                <th className="p-3 font-600">Recurso</th>
                <th className="p-3 font-600">Sensibles</th>
                <th className="p-3 font-600">IP</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => (
                <tr key={e.evento_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{e.fecha ?? "—"}</td>
                  <td className="p-3 text-slate-300 font-mono">{e.usuario_id ?? "—"}</td>
                  <td className="p-3 text-slate-300">{e.rol ?? "—"}</td>
                  <td className="p-3 text-slate-300">{e.accion ?? "—"}</td>
                  <td className="p-3 text-slate-400">{e.recurso ?? "—"}</td>
                  <td className="p-3">
                    {e.datos_sensibles ? (
                      <span className="text-amber-400">Sí</span>
                    ) : (
                      <span className="text-slate-500">—</span>
                    )}
                  </td>
                  <td className="p-3 text-slate-500 text-xs font-mono">{e.ip ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
