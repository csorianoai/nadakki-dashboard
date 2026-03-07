"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import { fetchExpedientes, generarExportacionPDF, generarExportacionZIP } from "@/lib/api/sic";
import Link from "next/link";

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

export default function SicExportacionesPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [expedientes, setExpedientes] = useState<Awaited<ReturnType<typeof fetchExpedientes>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
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

  const handlePDF = async (id: string) => {
    setExportando(`${id}-pdf`);
    setExito(null);
    try {
      const r = await generarExportacionPDF(id, tenant);
      setExito(`PDF generado para ${id}${r?.url ? ". Descargar: " + r.url : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  };

  const handleZIP = async (id: string) => {
    setExportando(`${id}-zip`);
    setExito(null);
    try {
      const r = await generarExportacionZIP(id, tenant);
      setExito(`ZIP generado para ${id}${r?.url ? ". Descargar: " + r.url : ""}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando expedientes…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Centro de Exportaciones Bancarias</h1>
      <p className="text-slate-500 text-sm mb-6">Generar PDF, ZIP y reportes por expediente</p>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}
      {exito && (
        <div className="mb-4 rounded-lg border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
          {exito}
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        {expedientes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">
            No hay expedientes. <Link href="/sic/expedientes" className="text-cyan-400 hover:underline">Ir a Expedientes</Link>
          </div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-600">Expediente</th>
                <th className="p-3 font-600">Estado</th>
                <th className="p-3 font-600">Cliente</th>
                <th className="p-3 font-600">Producto</th>
                <th className="p-3 font-600">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expedientes.map((e) => (
                <tr key={e.expediente_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link href={`/sic/expedientes/${e.expediente_id}`} className="text-cyan-400 hover:underline font-mono">
                      {e.expediente_id}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-xs ${
                        ESTADOS_BADGE[e.estado_expediente ?? ""] ?? "bg-slate-600/30 text-slate-400"
                      }`}
                    >
                      {e.estado_expediente ?? "—"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{e.referencia_cliente ?? "—"}</td>
                  <td className="p-3 text-slate-300">{e.referencia_producto ?? "—"}</td>
                  <td className="p-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handlePDF(e.expediente_id)}
                        disabled={!!exportando}
                        className="rounded px-2 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600 disabled:opacity-50"
                      >
                        {exportando === `${e.expediente_id}-pdf` ? "…" : "PDF"}
                      </button>
                      <button
                        onClick={() => handleZIP(e.expediente_id)}
                        disabled={!!exportando}
                        className="rounded px-2 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600 disabled:opacity-50"
                      >
                        {exportando === `${e.expediente_id}-zip` ? "…" : "ZIP"}
                      </button>
                    </div>
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
