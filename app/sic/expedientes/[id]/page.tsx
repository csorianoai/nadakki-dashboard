"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchExpediente,
  fetchTimeline,
  fetchNotas,
  crearNota,
  fetchVersiones,
  fetchAuditoria,
  fetchExportaciones,
  fetchExplicabilidad,
  fetchPermisos,
  fetchEvidencia,
  fetchDocumentos,
  compararVersiones,
  enviarOverride,
  cambiarEstado,
  generarExportacionPDF,
  generarExportacionZIP,
  generarPaqueteRegulatorio,
  type Expediente,
  type Nota,
  type Documento,
  type EstadoExpediente,
  type Explicabilidad,
  type Permisos,
  type VersionAnalisis,
  type EventoAuditoria,
  type Exportacion,
  type Evidencia,
} from "@/lib/api/sic";
import { PanelDecisionOverride } from "@/components/sic/PanelDecisionOverride";
import { PanelExplicabilidad } from "@/components/sic/PanelExplicabilidad";
import { ComparadorVersiones } from "@/components/sic/ComparadorVersiones";
import { PanelEvidencia } from "@/components/sic/PanelEvidencia";
import { MemoEjecutivo } from "@/components/sic/MemoEjecutivo";
import { PanelDocumentos } from "@/components/sic/PanelDocumentos";
import { LoadingSic, EmptySic, ErrorSic, SuccessSic } from "@/components/sic/EstadosSic";
import { useDemo } from "@/contexts/DemoContext";
import { getDemoExpedientes, getDemoEventosAuditoria, getDemoExportaciones } from "@/lib/demo-sic";

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

function Panel({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4 h-full flex flex-col">
      <h3 className="text-xs font-600 text-slate-400 uppercase tracking-wide mb-3">{titulo}</h3>
      <div className="flex-1 overflow-auto text-sm">{children}</div>
    </div>
  );
}

export default function SicExpedienteIdPage() {
  const params = useParams();
  const { tenantId } = useTenant();
  const { demoMode, escenario } = useDemo();
  const id = String(params?.id ?? "");
  const tenant = tenantId || "credicefi";

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [versiones, setVersiones] = useState<VersionAnalisis[]>([]);
  const [auditoria, setAuditoria] = useState<unknown[]>([]);
  const [exportaciones, setExportaciones] = useState<unknown[]>([]);
  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [explicabilidad, setExplicabilidad] = useState<Explicabilidad | null>(null);
  const [permisos, setPermisos] = useState<Permisos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [creandoNota, setCreandoNota] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [exportando, setExportando] = useState<string | null>(null);
  const [exitoExport, setExitoExport] = useState<string | null>(null);
  const [evidenciaAuditoria, setEvidenciaAuditoria] = useState<Evidencia | null>(null);

  const cargar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      const demos = getDemoExpedientes(escenario);
      const exp = demos.find((e) => e.expediente_id === id) ?? null;
      setExpediente(exp);
      setTimeline(exp ? [{ fecha: exp.fecha_creacion, evento: "Creación", tipo: "INICIO" }] : []);
      setNotas(exp ? [{ nota_id: "n1", expediente_id: id, contenido: "[Demo] Nota de análisis", rol_usuario: "analista" }] : []);
      setVersiones(exp ? [{ version_id: "v1", expediente_id: id, numero_version: 1, decision_version: exp.decision_actual }] : []);
      setAuditoria(getDemoEventosAuditoria(escenario).filter((e) => e.expediente_id === id));
      setExportaciones(getDemoExportaciones(escenario).filter((x) => x.expediente_id === id));
      setDocumentos(exp ? [
        { documento_id: "doc-demo-1", expediente_id: id, nombre_archivo: "cedula_identidad.pdf", tipo_documento: "application/pdf", tamano_bytes: 245_000, estado_documento: "SUBIDO", fecha_subida: "2026-03-10" },
        { documento_id: "doc-demo-2", expediente_id: id, nombre_archivo: "comprobante_ingresos.jpg", tipo_documento: "image/jpeg", tamano_bytes: 1_200_000, estado_documento: "SUBIDO", fecha_subida: "2026-03-10" },
      ] : []);
      setExplicabilidad(exp ? { narrativa_ejecutiva: "[Demo] Análisis de crédito simulado.", factores_a_favor: ["Score favorable"], factores_en_contra: ["Ratio DTI elevado"], reglas_aplicadas: ["Regla 1", "Regla 2"] } : null);
      setPermisos({ rol: "analista", puede_override: true, puede_exportar: true, puede_cambiar_estado: true });
      setLoading(false);
      return;
    }
    Promise.all([
      fetchExpediente(id, tenant),
      fetchTimeline(id, tenant),
      fetchNotas(id, tenant),
      fetchVersiones(id, tenant),
      fetchAuditoria(id, tenant),
      fetchExportaciones(id, tenant),
      fetchExplicabilidad(id, tenant).catch(() => null),
      fetchPermisos(id, tenant).catch(() => null),
      fetchDocumentos(id, tenant),
    ])
      .then(([exp, tl, nt, vr, au, ex, expb, perm, docs]) => {
        setExpediente(exp ?? null);
        setTimeline(Array.isArray(tl) ? tl : []);
        setNotas(Array.isArray(nt) ? nt : []);
        setVersiones(Array.isArray(vr) ? vr : []);
        setAuditoria(Array.isArray(au) ? au : []);
        setExportaciones(Array.isArray(ex) ? ex : []);
        setExplicabilidad(expb ?? null);
        setPermisos(perm ?? null);
        setDocumentos(Array.isArray(docs) ? docs : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, tenant, demoMode, escenario]);

  useEffect(() => cargar(), [cargar]);

  const handleCrearNota = useCallback(async () => {
    if (!nuevaNota.trim() || !id) return;
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      setNuevaNota("");
      return;
    }
    setCreandoNota(true);
    try {
      await crearNota(id, tenant, nuevaNota.trim());
      setNuevaNota("");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCreandoNota(false);
    }
  }, [id, tenant, nuevaNota, cargar]);

  const handleOverride = useCallback(
    async (decision: string, justificacion: string) => {
      if (demoMode && id.startsWith("EXP-DEMO-")) {
        cargar();
        return;
      }
      await enviarOverride(id, tenant, { decision_final: decision, justificacion });
      cargar();
    },
    [id, tenant, cargar]
  );

  const handleCambiarEstado = useCallback(async () => {
    if (!nuevoEstado.trim()) return;
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      setNuevoEstado("");
      cargar();
      return;
    }
    try {
      await cambiarEstado(id, tenant, nuevoEstado.trim());
      setNuevoEstado("");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id, tenant, nuevoEstado, cargar]);

  const handleExportarPDF = useCallback(async () => {
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      setExitoExport("[Demo] PDF generado.");
      return;
    }
    setExportando("pdf");
    setExitoExport(null);
    try {
      await generarExportacionPDF(id, tenant);
      setExitoExport("PDF generado correctamente.");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  }, [id, tenant, cargar]);

  const handleExportarZIP = useCallback(async () => {
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      setExitoExport("[Demo] ZIP generado.");
      return;
    }
    setExportando("zip");
    setExitoExport(null);
    try {
      await generarExportacionZIP(id, tenant);
      setExitoExport("ZIP generado correctamente.");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  }, [id, tenant, cargar]);

  const handleExportarRegulatorio = useCallback(async () => {
    if (demoMode && id.startsWith("EXP-DEMO-")) {
      setExitoExport("[Demo] Paquete regulatorio generado.");
      return;
    }
    setExportando("reg");
    setExitoExport(null);
    try {
      await generarPaqueteRegulatorio(id, tenant);
      setExitoExport("Paquete regulatorio generado correctamente.");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setExportando(null);
    }
  }, [id, tenant, cargar]);

  const handleCompararVersiones = useCallback(
    (va: string, vb: string) => compararVersiones(id, tenant, va, vb),
    [id, tenant]
  );

  const puedeOverride = permisos?.puede_override ?? false;
  const puedeCambiarEstado = permisos?.puede_cambiar_estado ?? false;
  const puedeExportar = permisos?.puede_exportar !== false;
  const puedeVerAuditoria = permisos?.puede_ver_auditoria !== false;
  const puedeAbrirComparador = permisos?.puede_abrir_comparador !== false;
  const transiciones = permisos?.transiciones_disponibles ?? [];

  if (loading && !expediente) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando expediente" mensaje="Obteniendo datos del expediente..." />
      </div>
    );
  }

  if (!expediente && !loading) {
    return (
      <div className="p-6">
        <EmptySic titulo="Expediente no encontrado" mensaje="El expediente solicitado no existe o no tiene acceso.">
          <Link href="/sic/expedientes" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">
            Volver a expedientes
          </Link>
        </EmptySic>
      </div>
    );
  }

  const e = expediente!;
  const hayOverride = Boolean(e.decision_final_humana && e.decision_final_humana !== e.decision_actual);
  const hayEvidencia = Boolean(
    (explicabilidad?.factores_a_favor?.length ?? 0) + (explicabilidad?.factores_en_contra?.length ?? 0) > 0
  );

  return (
    <div className="min-h-screen bg-[#0a0f1c] p-4">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/sic/expedientes" className="text-slate-500 hover:text-slate-300 text-xs mb-1 inline-block">
            ← Expedientes
          </Link>
          <h1 className="text-lg font-700 text-slate-100 m-0">
            Expediente <span className="font-mono text-cyan-300">{e.expediente_id}</span>
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/sic/expedientes/${id}/replay`}
            className="text-cyan-400 hover:underline text-xs"
          >
            Replay
          </Link>
          <span
            className={`px-2 py-1 rounded text-xs font-semibold ${
              ESTADOS_BADGE[(e.estado_expediente as EstadoExpediente) ?? ""] ?? "bg-slate-600/30 text-slate-400"
            }`}
          >
            {e.estado_expediente ?? "—"}
          </span>
          {permisos?.rol && (
            <span className="text-slate-500 text-xs">Rol: {permisos.rol}</span>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      {/* Señales de confianza */}
      <div className="flex flex-wrap gap-2 mb-4">
        {e.version_activa && (
          <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
            Versión activa: {e.version_activa}
          </span>
        )}
        <span className="px-2 py-0.5 rounded bg-slate-700/50 text-slate-300 text-xs">
          Decisión IA: {e.decision_actual ?? "—"}
        </span>
        {e.decision_final_humana && (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 text-xs">
            Decisión final: {e.decision_final_humana}
          </span>
        )}
        <span className={`px-2 py-0.5 rounded text-xs ${hayOverride ? "bg-amber-500/20 text-amber-300" : "bg-slate-700/50 text-slate-400"}`}>
          Override: {hayOverride ? "Sí" : "No"}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${timeline.length > 0 ? "bg-cyan-500/20 text-cyan-300" : "bg-slate-700/50 text-slate-400"}`}>
          Trazabilidad: {timeline.length > 0 ? "Sí" : "Parcial"}
        </span>
        <span className={`px-2 py-0.5 rounded text-xs ${hayEvidencia ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-400"}`}>
          Evidencia: {hayEvidencia ? "Disponible" : "No"}
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 200px)" }}>
        <div className="lg:col-span-3 space-y-4">
          <Panel titulo="Controles del expediente">
            <div className="space-y-2 text-xs">
              <div className="flex flex-wrap gap-1">
                <span className={`px-2 py-0.5 rounded ${puedeOverride ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-500"}`}>
                  Decidir: {puedeOverride ? "Sí" : "No"}
                </span>
                <span className={`px-2 py-0.5 rounded ${puedeOverride ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-500"}`}>
                  Override: {puedeOverride ? "Sí" : "No"}
                </span>
                <span className={`px-2 py-0.5 rounded ${puedeCambiarEstado ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-500"}`}>
                  Transición: {puedeCambiarEstado ? "Sí" : "No"}
                </span>
                <span className={`px-2 py-0.5 rounded ${puedeExportar ? "bg-emerald-500/20 text-emerald-300" : "bg-slate-700/50 text-slate-500"}`}>
                  Exportar: {puedeExportar ? "Sí" : "No"}
                </span>
              </div>
              {permisos?.rol && <p className="text-slate-500">Rol actual: {permisos.rol}</p>}
            </div>
          </Panel>
          <Panel titulo="Estado y transición">
            <div className="space-y-2">
              {puedeCambiarEstado && transiciones.length > 0 && (
                <div>
                  <select
                    value={nuevoEstado}
                    onChange={(e) => setNuevoEstado(e.target.value)}
                    className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs"
                  >
                    <option value="">Cambiar a…</option>
                    {transiciones.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <button
                    onClick={handleCambiarEstado}
                    disabled={!nuevoEstado}
                    className="mt-1 w-full rounded px-2 py-1 bg-slate-700 text-slate-200 text-xs hover:bg-slate-600 disabled:opacity-50"
                  >
                    Transicionar
                  </button>
                </div>
              )}
              {!puedeCambiarEstado && (
                <p className="text-slate-500 text-xs italic">No tiene permiso para cambiar estado.</p>
              )}
            </div>
          </Panel>
          <Panel titulo="Datos del expediente">
            <dl className="space-y-2 text-slate-300 text-xs">
              <div><dt className="text-slate-500">Cliente</dt><dd>{e.referencia_cliente ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Producto</dt><dd>{e.referencia_producto ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Asignado</dt><dd>{e.asignado_a ?? "—"}</dd></div>
              <div><dt className="text-slate-500">Creado</dt><dd>{e.fecha_creacion ?? "—"}</dd></div>
            </dl>
          </Panel>
          <Panel titulo="Línea de tiempo">
            {timeline.length === 0 ? (
              <p className="text-slate-500 text-xs">Sin eventos</p>
            ) : (
              <ul className="space-y-2">
                {(timeline as { fecha?: string; evento?: string; tipo?: string; detalle?: string }[]).map((ev, i) => (
                  <li key={i} className="text-xs text-slate-300 border-l-2 border-cyan-500/50 pl-2">
                    <span className="text-slate-500">{ev.fecha ?? ev.tipo ?? "—"}</span>
                    <span className="ml-1">{ev.evento ?? ev.detalle ?? ""}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Panel titulo="Panel de decisión y override">
            <PanelDecisionOverride
              expediente={e}
              puedeOverride={puedeOverride}
              onOverride={handleOverride}
            />
          </Panel>
          <Panel titulo="Explicabilidad">
            <PanelExplicabilidad
              data={explicabilidad}
              expedienteId={id}
              tenantId={tenant}
              onVerEvidencia={(evId) => fetchEvidencia(evId, tenant, id)}
            />
          </Panel>
          <Panel titulo="Comparador de versiones">
            {puedeAbrirComparador ? (
              <ComparadorVersiones versiones={versiones} onComparar={handleCompararVersiones} />
            ) : (
              <p className="text-slate-500 text-xs italic">No tiene permiso para abrir el comparador.</p>
            )}
          </Panel>
          <Panel titulo="Memo ejecutivo">
            <MemoEjecutivo expediente={e} explicabilidad={explicabilidad} />
          </Panel>
          <Panel titulo="KPIs y alertas">
            <p className="text-slate-500 text-xs">Datos de análisis en reporte.</p>
          </Panel>
        </div>

        <div className="lg:col-span-4 space-y-4">
          <Panel titulo="Notas del analista">
            <div className="space-y-3">
              {notas.map((n) => (
                <div key={n.nota_id} className="text-xs text-slate-300 p-2 bg-slate-800/50 rounded">
                  {n.contenido}
                  <p className="text-slate-500 mt-1">{n.fecha_creacion ?? n.rol_usuario}</p>
                </div>
              ))}
              <div>
                <textarea
                  value={nuevaNota}
                  onChange={(ev) => setNuevaNota(ev.target.value)}
                  placeholder="Nueva nota…"
                  rows={2}
                  className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1 text-slate-200 text-xs resize-none"
                />
                <button
                  onClick={handleCrearNota}
                  disabled={creandoNota || !nuevaNota.trim()}
                  className="mt-1 rounded px-3 py-1 bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 disabled:opacity-50"
                >
                  Guardar
                </button>
              </div>
            </div>
          </Panel>
          <Panel titulo="Documentos">
            <PanelDocumentos
              expedienteId={id}
              tenantId={tenant}
              documentos={documentos}
              demoMode={demoMode && id.startsWith("EXP-DEMO-")}
              onUploadComplete={cargar}
            />
          </Panel>
          <Panel titulo="Auditoría">
            {!puedeVerAuditoria ? (
              <p className="text-slate-500 text-xs italic">No tiene permiso para ver auditoría.</p>
            ) : auditoria.length === 0 ? (
              <p className="text-slate-500 text-xs">Sin eventos</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-300">
                {(auditoria as EventoAuditoria[]).map((a, i) => {
                  const tieneEv = Boolean(a.evidencia_id);
                  return (
                    <li key={a.evento_id ?? i}>
                      {tieneEv ? (
                        <button
                          type="button"
                          onClick={() => {
                            fetchEvidencia(a.evidencia_id!, tenant, id)
                              .then(setEvidenciaAuditoria)
                              .catch(() =>
                                setEvidenciaAuditoria({
                                  evidencia_id: a.evidencia_id,
                                  detalle: "Evidencia no disponible.",
                                })
                              );
                          }}
                          className="text-left hover:text-cyan-400 hover:underline"
                        >
                          {a.tipo_evento ?? a.fecha_evento} — {a.detalle ?? ""}
                          <span className="ml-1 text-cyan-500/80 text-[10px]">[evidencia]</span>
                        </button>
                      ) : (
                        <span>{a.tipo_evento ?? a.fecha_evento} — {a.detalle ?? ""}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
            {evidenciaAuditoria && (
              <div className="mt-3">
                <PanelEvidencia
                  evidencia={evidenciaAuditoria}
                  expedienteId={id}
                  onCerrar={() => setEvidenciaAuditoria(null)}
                />
              </div>
            )}
          </Panel>
          <Panel titulo="Exportaciones">
            <div className="space-y-2">
              {exportaciones.length > 0 && (
                <div>
                  <span className="text-slate-500 text-xs block mb-1">Historial</span>
                  <ul className="text-xs text-slate-300 space-y-1">
                    {(exportaciones as Exportacion[]).map((x) => (
                      <li key={x.exportacion_id} className="flex flex-wrap gap-x-2">
                        <span className={x.tipo_exportacion === "pdf" ? "text-amber-400" : "text-cyan-400"}>
                          {x.tipo_exportacion === "pdf" ? "PDF ejecutivo" : x.tipo_exportacion === "zip" ? "ZIP bancario" : x.tipo_exportacion ?? "—"}
                        </span>
                        <span>{x.estado_exportacion ?? "—"}</span>
                        {x.generado_por && <span className="text-slate-500">por {x.generado_por}</span>}
                        {x.fecha_generacion && <span className="text-slate-500">{x.fecha_generacion}</span>}
                        {x.mensaje_error && <span className="text-red-400">Error: {x.mensaje_error}</span>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {!puedeExportar ? (
                <p className="text-slate-500 text-xs italic">No tiene permiso para exportar.</p>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={handleExportarPDF}
                      disabled={!!exportando}
                      className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
                    >
                      {exportando === "pdf" ? "Generando…" : "PDF ejecutivo"}
                    </button>
                    <button
                      onClick={handleExportarZIP}
                      disabled={!!exportando}
                      className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
                    >
                      {exportando === "zip" ? "Generando…" : "ZIP bancario"}
                    </button>
                    <button
                      onClick={handleExportarRegulatorio}
                      disabled={!!exportando}
                      className="rounded px-3 py-1.5 bg-violet-700/50 text-violet-300 text-xs font-medium hover:bg-violet-600/50 disabled:opacity-50"
                    >
                      {exportando === "reg" ? "Generando…" : "Paquete regulatorio"}
                    </button>
                  </div>
                  {exitoExport && (
                    <div className="mt-2">
                      <SuccessSic titulo="Exportación" mensaje={exitoExport} />
                    </div>
                  )}
                </>
              )}
            </div>
          </Panel>
        </div>
      </div>
    </div>
  );
}
