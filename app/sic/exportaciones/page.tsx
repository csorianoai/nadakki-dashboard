"use client";

import { useEffect, useState } from "react";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchExpedientes,
  fetchExportacionesGlobal,
  generarExportacionPDF,
  generarExportacionZIP,
  generarPaqueteRegulatorio,
  type Expediente,
  type Exportacion,
} from "@/lib/api/sic";
import Link from "next/link";
import { LoadingSic, EmptySic, ErrorSic, SuccessSic } from "@/components/sic/EstadosSic";

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

const ESTADO_EXPORT: Record<string, string> = {
  completado: "text-emerald-400",
  pendiente: "text-amber-400",
  error: "text-red-400",
  generando: "text-cyan-400",
};

export default function SicExportacionesPage() {
  const { tenantId } = useTenant();
  const tenant = tenantId || "credicefi";
  const [expedientes, setExpedientes] = useState<Expediente[]>([]);
  const [exportaciones, setExportaciones] = useState<Exportacion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportando, setExportando] = useState<string | null>(null);
  const [exito, setExito] = useState<string | null>(null);

  const cargar = () => {
    fetchExpedientes(tenant)
      .then(setExpedientes)
      .catch(() => {});
    fetchExportacionesGlobal(tenant, 100)
      .then(setExportaciones)
      .catch(() => setExportaciones([]));
  };

  useEffect(() => {
    let alive = true;
    setLoading(true);
    Promise.all([
      fetchExpedientes(tenant),
      fetchExportacionesGlobal(tenant, 100).catch(() => []),
    ])
      .then(([expList, expList2]) => {
        if (alive) {
          setExpedientes(expList);
          setExportaciones(expList2);
        }
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
    setError(null);
    try {
      const r = await generarExportacionPDF(id, tenant);
      setExito(`PDF ejecutivo generado para ${id}${r?.url ? ". " + r.url : ""}`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  };

  const handleRegulatorio = async (id: string) => {
    setExportando(`${id}-reg`);
    setExito(null);
    setError(null);
    try {
      const r = await generarPaqueteRegulatorio(id, tenant);
      setExito(`Paquete regulatorio generado para ${id}${r?.url ? ". " + r.url : ""}`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  };

  const handleZIP = async (id: string) => {
    setExportando(`${id}-zip`);
    setExito(null);
    setError(null);
    try {
      const r = await generarExportacionZIP(id, tenant);
      setExito(`ZIP bancario generado para ${id}${r?.url ? ". " + r.url : ""}`);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando centro de exportaciones" mensaje="Obteniendo expedientes y exportaciones..." />
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-700 text-slate-100 m-0 mb-1">Centro de Exportaciones Bancarias</h1>
      <p className="text-slate-500 text-sm mb-6">Generar PDF ejecutivo, ZIP bancario y reportes por expediente</p>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}
      {exito && (
        <div className="mb-4">
          <SuccessSic titulo="Operación completada" mensaje={exito} />
        </div>
      )}

      {/* Historial de exportaciones */}
      <div className="mb-8 rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        <h2 className="text-sm font-600 text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-700/50">
          Historial de exportaciones
        </h2>
        {exportaciones.length === 0 ? (
          <EmptySic
            titulo="Sin exportaciones"
            mensaje="Las exportaciones generadas aparecerán aquí."
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 text-left text-slate-400 text-xs uppercase">
                <th className="p-3 font-600">Expediente</th>
                <th className="p-3 font-600">Tipo</th>
                <th className="p-3 font-600">Estado</th>
                <th className="p-3 font-600">Generado por</th>
                <th className="p-3 font-600">Fecha</th>
                <th className="p-3 font-600">Error</th>
              </tr>
            </thead>
            <tbody>
              {exportaciones.map((x) => (
                <tr key={x.exportacion_id} className="border-b border-slate-700/50 hover:bg-slate-800/30">
                  <td className="p-3">
                    <Link
                      href={`/sic/expedientes/${x.expediente_id}`}
                      className="text-cyan-400 hover:underline font-mono"
                    >
                      {x.expediente_id}
                    </Link>
                  </td>
                  <td className="p-3">
                    <span className={x.tipo_exportacion === "pdf" ? "text-amber-400" : x.tipo_exportacion === "regulatorio" ? "text-violet-400" : "text-cyan-400"}>
                      {x.tipo_exportacion === "pdf" ? "PDF ejecutivo" : x.tipo_exportacion === "zip" ? "ZIP bancario" : x.tipo_exportacion === "regulatorio" ? "Paquete regulatorio" : x.tipo_exportacion ?? "—"}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={ESTADO_EXPORT[(x.estado_exportacion ?? "").toLowerCase()] ?? "text-slate-400"}>
                      {x.estado_exportacion ?? "—"}
                    </span>
                  </td>
                  <td className="p-3 text-slate-300">{x.generado_por ?? "—"}</td>
                  <td className="p-3 text-slate-400 text-xs">{x.fecha_generacion ?? "—"}</td>
                  <td className="p-3">
                    {x.mensaje_error ? (
                      <span className="text-red-400 text-xs">{x.mensaje_error}</span>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Generar por expediente */}
      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        <h2 className="text-sm font-600 text-slate-400 uppercase tracking-wide px-4 py-3 border-b border-slate-700/50">
          Generar exportación por expediente
        </h2>
        {expedientes.length === 0 ? (
          <EmptySic titulo="Sin expedientes" mensaje="No hay expedientes disponibles para exportar.">
            <Link href="/sic/expedientes" className="text-cyan-400 hover:underline text-sm">
              Ir a Expedientes
            </Link>
          </EmptySic>
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
                    <div className="flex flex-wrap gap-2">
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
                      <button
                        onClick={() => handleRegulatorio(e.expediente_id)}
                        disabled={!!exportando}
                        className="rounded px-2 py-1 bg-violet-700/50 text-violet-300 text-xs hover:bg-violet-600/50 disabled:opacity-50"
                      >
                        {exportando === `${e.expediente_id}-reg` ? "…" : "Regulatorio"}
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
