"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { useTenant } from "@/contexts/TenantContext";
import {
  fetchSesionComite,
  fetchExpedientesSesion,
  votarExpediente,
  cerrarSesionComite,
  fetchExplicabilidad,
  type SesionComite,
  type ExpedienteEnSesion,
} from "@/lib/api/sic";
import { MemoEjecutivo } from "@/components/sic/MemoEjecutivo";
import { LoadingSic, EmptySic, ErrorSic, SuccessSic } from "@/components/sic/EstadosSic";
import { fetchExpediente } from "@/lib/api/sic";
import type { Explicabilidad } from "@/lib/api/sic";

const ESTADO_BADGE: Record<string, string> = {
  programada: "bg-slate-500/30 text-slate-300",
  abierta: "bg-cyan-500/30 text-cyan-300",
  cerrada: "bg-emerald-500/30 text-emerald-300",
  pospuesta: "bg-amber-500/30 text-amber-300",
};

export default function SicComiteSesionIdPage() {
  const params = useParams();
  const { tenantId } = useTenant();
  const id = String(params?.id ?? "");
  const tenant = tenantId || "credicefi";

  const [sesion, setSesion] = useState<SesionComite | null>(null);
  const [expedientes, setExpedientes] = useState<ExpedienteEnSesion[]>([]);
  const [explicabilidadMap, setExplicabilidadMap] = useState<Record<string, Explicabilidad | null>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [memoCierre, setMemoCierre] = useState("");
  const [cerrando, setCerrando] = useState(false);
  const [exitoCierre, setExitoCierre] = useState<string | null>(null);
  const [votando, setVotando] = useState<string | null>(null);
  const [expedienteMemo, setExpedienteMemo] = useState<string | null>(null);

  const cargar = useCallback(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    Promise.all([
      fetchSesionComite(id, tenant),
      fetchExpedientesSesion(id, tenant),
    ])
      .then(([s, exps]) => {
        setSesion(s ?? null);
        setExpedientes(exps ?? []);
        (exps ?? []).forEach((ex) => {
          fetchExplicabilidad(ex.expediente_id, tenant).then((exp) => {
            setExplicabilidadMap((m) => ({ ...m, [ex.expediente_id]: exp ?? null }));
          }).catch(() => {});
        });
      })
      .catch((e) => setError(e instanceof Error ? e.message : String(e)))
      .finally(() => setLoading(false));
  }, [id, tenant]);

  useEffect(() => cargar(), [cargar]);

  const handleVotar = useCallback(async (expId: string, voto: "apruebo" | "rechazo" | "abstenido") => {
    setVotando(expId);
    try {
      await votarExpediente(id, expId, tenant, voto);
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setVotando(null);
    }
  }, [id, tenant, cargar]);

  const handleCerrar = useCallback(async () => {
    setCerrando(true);
    setExitoCierre(null);
    try {
      await cerrarSesionComite(id, tenant, memoCierre || undefined);
      setExitoCierre("Sesión cerrada correctamente.");
      setMemoCierre("");
      cargar();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setCerrando(false);
    }
  }, [id, tenant, memoCierre, cargar]);

  const puedeVotar = sesion?.estado_sesion === "abierta";
  const puedeCerrar = sesion?.estado_sesion === "abierta";

  if (loading && !sesion) {
    return (
      <div className="p-6">
        <LoadingSic titulo="Cargando sesión" mensaje="Obteniendo datos de la sesión..." />
      </div>
    );
  }

  if (!sesion && !loading) {
    return (
      <div className="p-6">
        <EmptySic titulo="Sesión no encontrada" mensaje="La sesión solicitada no existe.">
          <Link href="/sic/comite/sesiones" className="text-cyan-400 hover:underline text-sm">Volver a sesiones</Link>
        </EmptySic>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <Link href="/sic/comite/sesiones" className="text-slate-500 hover:text-slate-300 text-xs mb-1 inline-block">← Sesiones</Link>
          <h1 className="text-xl font-700 text-slate-100 m-0">Sesión de Comité</h1>
          <p className="text-slate-500 text-sm m-0 mt-0.5 font-mono">{sesion!.sesion_id}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className={`px-2 py-1 rounded text-xs ${ESTADO_BADGE[sesion!.estado_sesion ?? ""] ?? "bg-slate-600/30"}`}>
            {sesion!.estado_sesion ?? "—"}
          </span>
          <span className="text-slate-500 text-xs">{sesion!.fecha_sesion ?? ""}</span>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorSic titulo="Error" mensaje={error} />
        </div>
      )}
      {exitoCierre && (
        <div className="mb-4">
          <SuccessSic titulo="Operación completada" mensaje={exitoCierre} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
          <h3 className="text-slate-400 text-xs uppercase mb-2">Participantes</h3>
          <ul className="text-slate-300 text-sm space-y-1">
            {(sesion!.participantes ?? []).length > 0 ? (sesion!.participantes ?? []).map((p) => (
              <li key={p}>{p}</li>
            )) : <li className="text-slate-500 italic">Sin participantes cargados</li>}
          </ul>
        </div>
        <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
          <h3 className="text-slate-400 text-xs uppercase mb-2">Expedientes en sesión</h3>
          <p className="text-slate-300 text-2xl font-700">{expedientes.length}</p>
        </div>
        {puedeCerrar && (
          <div className="rounded-lg border border-slate-700/50 bg-slate-900/50 p-4">
            <h3 className="text-slate-400 text-xs uppercase mb-2">Cerrar sesión</h3>
            <textarea
              value={memoCierre}
              onChange={(e) => setMemoCierre(e.target.value)}
              placeholder="Memo de cierre (opcional)"
              rows={2}
              className="w-full bg-slate-800/80 border border-slate-600 rounded px-2 py-1.5 text-slate-200 text-xs mb-2 resize-none"
            />
            <button
              onClick={handleCerrar}
              disabled={cerrando}
              className="w-full rounded px-3 py-1.5 bg-cyan-600 text-white text-xs font-medium hover:bg-cyan-500 disabled:opacity-50"
            >
              {cerrando ? "Cerrando…" : "Cerrar sesión"}
            </button>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-slate-700/50 bg-slate-900/50 overflow-hidden">
        <h2 className="text-sm font-600 text-slate-400 uppercase px-4 py-3 border-b border-slate-700/50">Expedientes</h2>
        {expedientes.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-sm">Sin expedientes en esta sesión.</div>
        ) : (
          <div className="divide-y divide-slate-700/50">
            {expedientes.map((ex) => (
              <div key={ex.expediente_id} className="p-4 hover:bg-slate-800/30">
                <div className="flex flex-wrap items-center justify-between gap-4 mb-2">
                  <div>
                    <Link href={`/sic/expedientes/${ex.expediente_id}`} className="text-cyan-400 hover:underline font-mono">
                      {ex.expediente_id}
                    </Link>
                    <span className="ml-2 text-slate-500 text-xs">Decisión IA: {ex.decision_ia ?? "—"} ({((ex.confianza ?? 0) <= 1 ? (ex.confianza ?? 0) * 100 : ex.confianza)?.toFixed(0)}%)</span>
                  </div>
                  <div className="flex gap-2">
                    {puedeVotar && (
                      <>
                        <button
                          onClick={() => handleVotar(ex.expediente_id, "apruebo")}
                          disabled={!!votando}
                          className="rounded px-2 py-1 bg-emerald-600/50 text-emerald-300 text-xs hover:bg-emerald-600 disabled:opacity-50"
                        >
                          Apruebo
                        </button>
                        <button
                          onClick={() => handleVotar(ex.expediente_id, "rechazo")}
                          disabled={!!votando}
                          className="rounded px-2 py-1 bg-red-600/50 text-red-300 text-xs hover:bg-red-600 disabled:opacity-50"
                        >
                          Rechazo
                        </button>
                        <button
                          onClick={() => handleVotar(ex.expediente_id, "abstenido")}
                          disabled={!!votando}
                          className="rounded px-2 py-1 bg-slate-600 text-slate-300 text-xs hover:bg-slate-500 disabled:opacity-50"
                        >
                          Abstenido
                        </button>
                      </>
                    )}
                    <button
                      onClick={() => setExpedienteMemo(expedienteMemo === ex.expediente_id ? null : ex.expediente_id)}
                      className="rounded px-2 py-1 bg-slate-600 text-slate-300 text-xs hover:bg-slate-500"
                    >
                      Memo
                    </button>
                  </div>
                </div>
                <div className="text-xs text-slate-400">
                  Votos: {ex.votos_a_favor ?? 0} a favor · {ex.votos_en_contra ?? 0} en contra · Decisión: {ex.decision_final_sesion ?? "Pendiente"}
                </div>
                {expedienteMemo === ex.expediente_id && (
                  <div className="mt-3">
                    <MemoEjecutivoMemo expedienteId={ex.expediente_id} tenant={tenant} explicabilidad={explicabilidadMap[ex.expediente_id]} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function MemoEjecutivoMemo({
  expedienteId,
  tenant,
  explicabilidad,
}: {
  expedienteId: string;
  tenant: string;
  explicabilidad?: Explicabilidad | null;
}) {
  const [exp, setExp] = useState<Awaited<ReturnType<typeof fetchExpediente>> | null>(null);
  useEffect(() => {
    fetchExpediente(expedienteId, tenant).then(setExp);
  }, [expedienteId, tenant]);
  if (!exp) return <div className="text-slate-500 text-xs">Cargando...</div>;
  return <MemoEjecutivo expediente={exp} explicabilidad={explicabilidad ?? null} />;
}
