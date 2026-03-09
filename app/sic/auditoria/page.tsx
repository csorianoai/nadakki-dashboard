"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { useDemo } from "@/contexts/DemoContext";
import { fetchAuditoriaGlobal, type EventoAuditoria } from "@/lib/api/sic";
import { getDemoEventosAuditoria } from "@/lib/demo-sic";
import Link from "next/link";
import { LoadingSic, EmptySic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicAuditoriaPage() {
  const { tenantId } = useTenant();
  const { demoMode, escenario } = useDemo();
  const tenant = tenantId || "credicefi";
  const [eventos, setEventos] = useState<EventoAuditoria[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [limit] = useState(100);
  const [filtroTipo, setFiltroTipo] = useState("");
  const [filtroExpediente, setFiltroExpediente] = useState("");

  useEffect(() => {
    let alive = true;
    if (demoMode) {
      setEventos(getDemoEventosAuditoria(escenario));
      setLoading(false);
      setError(null);
      return;
    }
    fetchAuditoriaGlobal(tenant, limit)
      .then((list) => { if (alive) setEventos(list); })
      .catch((e) => { if (alive) setError(e instanceof Error ? e.message : String(e)); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [tenant, limit, demoMode, escenario]);

  const tipos = Array.from(new Set(eventos.map((e) => e.tipo_evento).filter(Boolean))) as string[];
  const expedientes = Array.from(new Set(eventos.map((e) => e.expediente_id).filter(Boolean))) as string[];

  const filtrados = eventos.filter((e) => {
    if (filtroTipo && e.tipo_evento !== filtroTipo) return false;
    if (filtroExpediente && e.expediente_id !== filtroExpediente) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando auditoría" mensaje="Obteniendo eventos de auditoría..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Panel de Auditoría Expandida</h1>
      <p className="text-slate-500 text-sm mb-6">Eventos de auditoría global del tenant. Trazabilidad y cumplimiento.</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="mb-4 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-slate-500 text-xs block mb-1">Tipo</label>
          <select
            value={filtroTipo}
            onChange={(e) => setFiltroTipo(e.target.value)}
            className="bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-sm"
          >
            <option value="">Todos</option>
            {tipos.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-slate-500 text-xs block mb-1">Expediente</label>
          <select
            value={filtroExpediente}
            onChange={(e) => setFiltroExpediente(e.target.value)}
            className="bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-sm"
          >
            <option value="">Todos</option>
            {expedientes.map((id) => (
              <option key={id} value={id}>{id}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        {filtrados.length === 0 ? (
          <EmptySic
            titulo="Sin eventos de auditoría"
            mensaje="Los eventos de auditoría aparecerán aquí cuando exista actividad."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-600">Fecha</th>
                <th className="p-3 font-600">Tipo</th>
                <th className="p-3 font-600">Expediente</th>
                <th className="p-3 font-600">Actor / Rol</th>
                <th className="p-3 font-600">Detalle</th>
              </tr>
            </thead>
            <tbody>
              {filtrados.map((e) => (
                <tr key={e.evento_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3 text-slate-400 text-xs whitespace-nowrap">{e.fecha_evento ?? "—"}</td>
                  <td className="p-3 text-slate-300">{e.tipo_evento ?? "—"}</td>
                  <td className="p-3">
                    {e.expediente_id ? (
                      <Link
                        href={`/sic/expedientes/${e.expediente_id}`}
                        className="text-cyan-400 hover:underline font-mono"
                      >
                        {e.expediente_id}
                      </Link>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 text-slate-300">{e.actor_id ?? e.actor_rol ?? "—"}</td>
                  <td className="p-3 text-slate-400 max-w-md truncate" title={e.detalle ?? ""}>
                    {e.detalle ?? "—"}
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
