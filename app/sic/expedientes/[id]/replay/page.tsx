"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchReplay,
  fetchExpediente,
  fetchExplicabilidad,
  fetchTimeline,
  fetchAuditoria,
  type ReplayData,
  type Expediente,
  type Explicabilidad,
} from "@/lib/api/sic";
import { LoadingSic, EmptySic, ErrorSic } from "@/components/sic/EstadosSic";

export default function SicExpedienteReplayPage() {
  const params = useParams();
  const { tenantId } = useTenant();
  const id = String(params?.id ?? "");
  const tenant = tenantId || "credicefi";

  const [replay, setReplay] = useState<ReplayData | null>(null);
  const [expediente, setExpediente] = useState<Expediente | null>(null);
  const [explicabilidad, setExplicabilidad] = useState<Explicabilidad | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchReplay(id, tenant),
      fetchExpediente(id, tenant),
      fetchExplicabilidad(id, tenant).catch(() => null),
      fetchTimeline(id, tenant).catch(() => []),
      fetchAuditoria(id, tenant).catch(() => []),
    ])
      .then(([r, e, expb, tl, au]) => {
        if (r) {
          setReplay(r);
        } else {
          setReplay(null);
        }
        setExpediente(e ?? null);
        setExplicabilidad(expb ?? null);
        if (!r && e) {
          setReplay({
            expediente_id: id,
            decision_ia: e.decision_actual,
            confianza: e.confianza_decision,
            decision_final: e.decision_final_humana,
            override_activo: Boolean(e.decision_final_humana && e.decision_final_humana !== e.decision_actual),
            override_usuario: e.override_usuario,
            reglas_aplicadas: expb?.reglas_aplicadas ?? [],
            timeline: (Array.isArray(tl) ? tl : []).map((ev: { fecha?: string; evento?: string; tipo?: string; actor?: string }) => ({
              fecha: ev.fecha ?? ev.tipo,
              evento: ev.evento,
              actor: ev.actor,
            })),
          });
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, tenant]);

  useEffect(() => cargar(), [cargar]);

  if (loading && !expediente) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando replay" mensaje="Reconstruyendo cadena de decisión..." />
      </div>
    );
  }

  if (!expediente && !loading) {
    return (
      <div className="p-6">
        <EmptySic titulo="Expediente no encontrado" mensaje="No se pudo cargar el replay.">
          <Link href="/sic/expedientes" className="text-cyan-400 hover:underline text-sm">Volver a expedientes</Link>
        </EmptySic>
      </div>
    );
  }

  const r = replay ?? {
    expediente_id: id,
    decision_ia: expediente!.decision_actual,
    confianza: expediente!.confianza_decision,
    decision_final: expediente!.decision_final_humana,
    override_activo: Boolean(expediente!.decision_final_humana && expediente!.decision_final_humana !== expediente!.decision_actual),
    override_usuario: expediente!.override_usuario,
    reglas_aplicadas: explicabilidad?.reglas_aplicadas ?? [],
    timeline: [],
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href={`/sic/expedientes/${id}`} className="text-slate-500 hover:text-slate-300 text-xs mb-1 inline-block">← Expediente</Link>
          <h1 className="text-xl font-700 text-slate-100 m-0">Decision Replay</h1>
          <p className="text-slate-500 text-sm m-0 mt-0.5 font-mono">{id}</p>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        <div className="border-b border-slate-700/50 p-4">
          <h2 className="text-slate-400 text-xs uppercase mb-3">Cadena de decisión</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <dt className="text-slate-500 text-xs">Versión analizada</dt>
              <dd className="text-slate-200 font-mono">{r.version_analizada?.version_id ?? expediente!.version_activa ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Decisión IA</dt>
              <dd className="text-slate-200">{r.decision_ia ?? "—"} ({(r.confianza ?? 0) <= 1 ? ((r.confianza ?? 0) * 100).toFixed(0) : r.confianza}%)</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Decisión final</dt>
              <dd className="text-emerald-300">{r.decision_final ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500 text-xs">Override</dt>
              <dd className={r.override_activo ? "text-amber-300" : "text-slate-400"}>
                {r.override_activo ? `Sí — ${r.override_usuario ?? ""}` : "No"}
              </dd>
              {r.override_usuario && r.override_activo && (
                <dd className="text-slate-500 text-xs mt-0.5">{r.override_fecha ?? ""}</dd>
              )}
            </div>
          </div>
        </div>

        {r.reglas_aplicadas && r.reglas_aplicadas.length > 0 && (
          <div className="border-b border-slate-700/50 p-4">
            <h3 className="text-slate-400 text-xs uppercase mb-2">Reglas aplicadas</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              {r.reglas_aplicadas.map((reg, i) => (
                <li key={i}>{reg}</li>
              ))}
            </ul>
          </div>
        )}

        {r.evidencias_usadas && r.evidencias_usadas.length > 0 && (
          <div className="border-b border-slate-700/50 p-4">
            <h3 className="text-slate-400 text-xs uppercase mb-2">Evidencias usadas</h3>
            <ul className="text-slate-300 text-sm space-y-1">
              {r.evidencias_usadas.map((ev, i) => (
                <li key={i}>{ev.referencia ?? ev.tipo_evidencia ?? ev.evidencia_id}</li>
              ))}
            </ul>
          </div>
        )}

        {r.timeline && r.timeline.length > 0 && (
          <div className="p-4">
            <h3 className="text-slate-400 text-xs uppercase mb-2">Timeline de decisión</h3>
            <ul className="space-y-2">
              {r.timeline.map((ev, i) => (
                <li key={i} className="text-xs text-slate-300 border-l-2 border-cyan-500/50 pl-2">
                  <span className="text-slate-500">{ev.fecha ?? "—"}</span>
                  <span className="ml-1">{ev.evento ?? ""}</span>
                  {ev.actor && <span className="ml-1 text-slate-400">— {ev.actor}</span>}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
