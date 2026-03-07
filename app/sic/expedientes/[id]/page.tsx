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
  compararVersiones,
  enviarOverride,
  cambiarEstado,
  generarExportacionPDF,
  generarExportacionZIP,
  type Expediente,
  type Nota,
  type EstadoExpediente,
  type Explicabilidad,
  type Permisos,
  type VersionAnalisis,
} from "@/lib/api/sic";
import { PanelDecisionOverride } from "@/components/sic/PanelDecisionOverride";
import { PanelExplicabilidad } from "@/components/sic/PanelExplicabilidad";
import { ComparadorVersiones } from "@/components/sic/ComparadorVersiones";

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
  const id = String(params?.id ?? "");
  const tenant = tenantId || "credicefi";

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [versiones, setVersiones] = useState<VersionAnalisis[]>([]);
  const [auditoria, setAuditoria] = useState<unknown[]>([]);
  const [exportaciones, setExportaciones] = useState<unknown[]>([]);
  const [explicabilidad, setExplicabilidad] = useState<Explicabilidad | null>(null);
  const [permisos, setPermisos] = useState<Permisos | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [creandoNota, setCreandoNota] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState("");
  const [exportando, setExportando] = useState<string | null>(null);
  const [exitoExport, setExitoExport] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchExpediente(id, tenant),
      fetchTimeline(id, tenant),
      fetchNotas(id, tenant),
      fetchVersiones(id, tenant),
      fetchAuditoria(id, tenant),
      fetchExportaciones(id, tenant),
      fetchExplicabilidad(id, tenant).catch(() => null),
      fetchPermisos(id, tenant).catch(() => null),
    ])
      .then(([exp, tl, nt, vr, au, ex, expb, perm]) => {
        setExpediente(exp ?? null);
        setTimeline(Array.isArray(tl) ? tl : []);
        setNotas(Array.isArray(nt) ? nt : []);
        setVersiones(Array.isArray(vr) ? vr : []);
        setAuditoria(Array.isArray(au) ? au : []);
        setExportaciones(Array.isArray(ex) ? ex : []);
        setExplicabilidad(expb ?? null);
        setPermisos(perm ?? null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, tenant]);

  useEffect(() => cargar(), [cargar]);

  const handleCrearNota = useCallback(async () => {
    if (!nuevaNota.trim() || !id) return;
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
      await enviarOverride(id, tenant, { decision_final: decision, justificacion });
      cargar();
    },
    [id, tenant, cargar]
  );

  const handleCambiarEstado = useCallback(async () => {
    if (!nuevoEstado.trim()) return;
    try {
      await cambiarEstado(id, tenant, nuevoEstado.trim());
      setNuevoEstado("");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id, tenant, nuevoEstado, cargar]);

  const handleExportarPDF = useCallback(async () => {
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

  const handleCompararVersiones = useCallback(
    (va: string, vb: string) => compararVersiones(id, tenant, va, vb),
    [id, tenant]
  );

  const puedeOverride = permisos?.puede_override ?? false;
  const puedeCambiarEstado = permisos?.puede_cambiar_estado ?? false;
  const puedeExportar = permisos?.puede_exportar ?? true;
  const transiciones = permisos?.transiciones_disponibles ?? [];

  if (loading && !expediente) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6 flex items-center justify-center">
        <div className="text-slate-400 text-sm">Cargando expediente…</div>
      </div>
    );
  }

  if (!expediente && !loading) {
    return (
      <div className="min-h-screen bg-[#0a0f1c] p-6">
        <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 p-8 text-center">
          <p className="text-slate-400 text-sm">Expediente no encontrado</p>
          <Link href="/sic/expedientes" className="mt-4 inline-block text-cyan-400 hover:underline text-sm">
            Volver a expedientes
          </Link>
        </div>
      </div>
    );
  }

  const e = expediente!;

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
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 140px)" }}>
        <div className="lg:col-span-3 space-y-4">
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
                <p className="text-slate-500 text-xs italic">Sin permiso para cambiar estado.</p>
              )}
            </div>
          </Panel>
          <Panel titulo="Permisos">
            <ul className="text-xs text-slate-300 space-y-1">
              <li>Decisión: {puedeOverride ? "Sí" : "No"}</li>
              <li>Exportar: {puedeExportar ? "Sí" : "No"}</li>
              <li>Transición: {puedeCambiarEstado ? "Sí" : "No"}</li>
            </ul>
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
            <PanelExplicabilidad data={explicabilidad} />
          </Panel>
          <Panel titulo="Comparador de versiones">
            <ComparadorVersiones versiones={versiones} onComparar={handleCompararVersiones} />
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
          <Panel titulo="Auditoría">
            {auditoria.length === 0 ? (
              <p className="text-slate-500 text-xs">Sin eventos</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-300">
                {(auditoria as { tipo_evento?: string; fecha_evento?: string; detalle?: string }[]).map((a, i) => (
                  <li key={i}>{a.tipo_evento ?? a.fecha_evento} — {a.detalle ?? ""}</li>
                ))}
              </ul>
            )}
          </Panel>
          <Panel titulo="Exportaciones">
            <div className="space-y-2">
              {exportaciones.length > 0 && (
                <ul className="text-xs text-slate-300 space-y-1">
                  {(exportaciones as { tipo_exportacion?: string; estado_exportacion?: string }[]).map((x, i) => (
                    <li key={i}>{x.tipo_exportacion} — {x.estado_exportacion}</li>
                  ))}
                </ul>
              )}
              {!puedeExportar ? (
                <p className="text-slate-500 text-xs italic">Sin permiso para exportar.</p>
              ) : (
                <>
                  <div className="flex gap-2">
                    <button
                      onClick={handleExportarPDF}
                      disabled={!!exportando}
                      className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
                    >
                      {exportando === "pdf" ? "Generando…" : "Generar PDF"}
                    </button>
                    <button
                      onClick={handleExportarZIP}
                      disabled={!!exportando}
                      className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600 disabled:opacity-50"
                    >
                      {exportando === "zip" ? "Generando…" : "Generar ZIP"}
                    </button>
                  </div>
                  {exitoExport && (
                    <div className="rounded border border-emerald-500/50 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-300">
                      {exitoExport}
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
