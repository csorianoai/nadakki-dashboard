"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
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
  generarExportacionPDF,
  generarExportacionZIP,
  type Expediente,
  type Nota,
  type EstadoExpediente,
} from "@/lib/api/sic";

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
  const router = useRouter();
  const { tenantId } = useTenant();
  const id = String(params?.id ?? "");
  const tenant = tenantId || "credicefi";

  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [timeline, setTimeline] = useState<unknown[]>([]);
  const [notas, setNotas] = useState<Nota[]>([]);
  const [versiones, setVersiones] = useState<unknown[]>([]);
  const [auditoria, setAuditoria] = useState<unknown[]>([]);
  const [exportaciones, setExportaciones] = useState<unknown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [nuevaNota, setNuevaNota] = useState("");
  const [creandoNota, setCreandoNota] = useState(false);

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
    ])
      .then(([exp, tl, nt, vr, au, ex]) => {
        setExpediente(exp ?? null);
        setTimeline(Array.isArray(tl) ? tl : []);
        setNotas(Array.isArray(nt) ? nt : []);
        setVersiones(Array.isArray(vr) ? vr : []);
        setAuditoria(Array.isArray(au) ? au : []);
        setExportaciones(Array.isArray(ex) ? ex : []);
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, tenant]);

  useEffect(() => {
    cargar();
  }, [cargar]);

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

  const handleExportarPDF = useCallback(async () => {
    if (!id) return;
    try {
      await generarExportacionPDF(id, tenant);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id, tenant, cargar]);

  const handleExportarZIP = useCallback(async () => {
    if (!id) return;
    try {
      await generarExportacionZIP(id, tenant);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [id, tenant, cargar]);

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
        <span
          className={`px-2 py-1 rounded text-xs font-medium ${
            ESTADOS_BADGE[(e.estado_expediente as EstadoExpediente) ?? ""] ?? "bg-slate-600/30 text-slate-400"
          }`}
        >
          {e.estado_expediente ?? "—"}
        </span>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/50 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4" style={{ minHeight: "calc(100vh - 140px)" }}>
        <div className="lg:col-span-3 space-y-4">
          <Panel titulo="Datos del expediente">
            <dl className="space-y-2 text-slate-300">
              <div><dt className="text-slate-500 text-xs">Cliente</dt><dd>{e.referencia_cliente ?? "—"}</dd></div>
              <div><dt className="text-slate-500 text-xs">Producto</dt><dd>{e.referencia_producto ?? "—"}</dd></div>
              <div><dt className="text-slate-500 text-xs">Asignado</dt><dd>{e.asignado_a ?? "—"}</dd></div>
              <div><dt className="text-slate-500 text-xs">Creado</dt><dd className="text-xs">{e.fecha_creacion ?? "—"}</dd></div>
            </dl>
          </Panel>
          <Panel titulo="Línea de tiempo">
            {timeline.length === 0 ? (
              <p className="text-slate-500 text-xs">Sin eventos</p>
            ) : (
              <ul className="space-y-2">
                {(timeline as { fecha?: string; evento?: string; tipo?: string }[]).map((ev, i) => (
                  <li key={i} className="text-xs text-slate-300 border-l-2 border-slate-600 pl-2">
                    {ev.fecha ?? ev.tipo ?? "Evento"} — {ev.evento ?? ev.detalle ?? ""}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <Panel titulo="Panel de decisión">
            <div className="space-y-2">
              <p className="text-slate-300"><span className="text-slate-500">Decisión:</span> {e.decision_actual ?? "—"}</p>
              <p className="text-slate-300"><span className="text-slate-500">Confianza:</span> {e.confianza_decision ?? "—"}</p>
            </div>
          </Panel>
          <Panel titulo="KPIs y alertas">
            <p className="text-slate-500 text-xs">Datos de análisis disponibles en reporte.</p>
          </Panel>
          <Panel titulo="Versiones del análisis">
            {versiones.length === 0 ? (
              <p className="text-slate-500 text-xs">Sin versiones</p>
            ) : (
              <ul className="space-y-1 text-xs text-slate-300">
                {versiones.map((v: { numero_version?: number; fecha_version?: string }, i) => (
                  <li key={i}>v{v.numero_version ?? i + 1} — {v.fecha_version ?? ""}</li>
                ))}
              </ul>
            )}
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
              <p className="text-slate-500 text-xs">Sin eventos de auditoría</p>
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
              <div className="flex gap-2">
                <button
                  onClick={handleExportarPDF}
                  className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600"
                >
                  Generar PDF
                </button>
                <button
                  onClick={handleExportarZIP}
                  className="rounded px-3 py-1.5 bg-slate-700 text-slate-200 text-xs font-medium hover:bg-slate-600"
                >
                  Generar ZIP
                </button>
              </div>
            </div>
          </Panel>
          <Panel titulo="Chat con expediente">
            <p className="text-slate-500 text-xs">Próximamente</p>
          </Panel>
        </div>
      </div>
    </div>
  );
}
