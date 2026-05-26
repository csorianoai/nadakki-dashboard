"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { ShieldCheck } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getAuditTrailProject, verifyProyectosAuditTrail } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

function trailRows(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw.filter(Boolean) as Record<string, unknown>[];
  if (!raw || typeof raw !== "object") return [];
  const o = raw as Record<string, unknown>;
  for (const k of ["entries", "items", "audit", "data"] as const) {
    if (Array.isArray(o[k])) return o[k] as Record<string, unknown>[];
  }
  return asObjectArray(raw);
}

export function AuditProjectClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [trailLoading, setTrailLoading] = useState(true);
  const [trailError, setTrailError] = useState<Error | null>(null);
  const [trailData, setTrailData] = useState<unknown | null>(null);

  const [verifyBusy, setVerifyBusy] = useState(false);
  const [verifyData, setVerifyData] = useState<unknown | null>(undefined);
  const [verifyBanner, setVerifyBanner] = useState<string | null>(null);

  const loadTrail = useCallback(async () => {
    if (!tid) return;
    setTrailLoading(true);
    setTrailError(null);
    try {
      setTrailData(await getAuditTrailProject(tid, proyectoId));
      setVerifyBanner(null);
      setVerifyData(undefined);
    } catch (e) {
      setTrailError(e instanceof Error ? e : new Error("Fallo al cargar audit trail"));
      setTrailData(null);
    } finally {
      setTrailLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void loadTrail();
  }, [loadTrail]);

  const runVerify = async () => {
    if (!tid) return;
    setVerifyBusy(true);
    setVerifyBanner(null);
    try {
      const out = await verifyProyectosAuditTrail(tid, proyectoId);
      setVerifyData(out);
      if (out === null) {
        setVerifyBanner("VERIFY sin respuesta estable — revisar OpenAPI viviente.");
      }
    } catch (e) {
      setVerifyData(null);
      setVerifyBanner(e instanceof Error ? e.message : "Error en verify");
    } finally {
      setVerifyBusy(false);
    }
  };

  let verifyPreview = "";
  if (verifyData !== undefined && verifyData !== null) {
    try {
      verifyPreview = JSON.stringify(verifyData, null, 2);
    } catch {
      verifyPreview = String(verifyData);
    }
  }

  const events = trailRows(trailData);

  return (
    <div className="space-y-10 pb-8">
      <Link href={`/proyectos/${encodeURIComponent(proyectoId)}`} className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white">
        ← Detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex gap-4 border border-violet-500/35 p-6">
          <ShieldCheck className="h-10 w-10 text-violet-200" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: BP_ACCENTS.glow }}>
              Audit trail obra
            </p>
            <h1 className="text-2xl font-bold text-white">Audit trail</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Cronología dorada NADAKKI + zona VERIFY — mismas rutas contractuales.
            </p>
          </div>
        </GlassCard>
      </motion.div>

      <GlassCard hover={false} className="p-6">
        <h2 className="mb-6 text-sm font-bold uppercase tracking-[0.18em] text-amber-200/90">Línea temporal</h2>
        {trailLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((x) => (
              <div key={x} className="h-16 animate-pulse rounded-xl bg-white/5" />
            ))}
          </div>
        ) : trailError ? (
          <p className="text-sm text-rose-200">{trailError.message}</p>
        ) : events.length === 0 ? (
          <p className="text-sm text-zinc-400">Cadena registral vacía por ahora — la API seguirá trazando eventos firmados.</p>
        ) : (
          <ul className="relative space-y-0 border-l-2 border-amber-400/35 pl-6">
            {events.map((e, i) => (
              <motion.li
                key={String(e.id ?? e.trace_id ?? i)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.05 * i }}
                className="relative pb-8 last:pb-0"
              >
                <span className="absolute -left-[9px] top-2 h-3 w-3 rounded-full bg-amber-400 shadow-[0_0_12px_rgba(251,191,36,0.9)] ring-4 ring-black/70" aria-hidden />
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-amber-200/95">
                  {String(e.created_at ?? e.timestamp ?? "sin marca")}
                </p>
                <p className="text-sm font-semibold text-white">{String(e.action ?? e.event ?? e.type ?? "Evento auditoría")}</p>
                <p className="text-xs text-zinc-500">{String(e.actor_id ?? e.actor ?? "Sistema")}</p>
                {e.detail ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-white/10 bg-black/40 p-2 text-[10px] leading-relaxed text-emerald-100/95">
                    {typeof e.detail === "string"
                      ? e.detail
                      : JSON.stringify(e.detail, null, 2)}
                  </pre>
                ) : null}
              </motion.li>
            ))}
          </ul>
        )}
      </GlassCard>

      <ProyectosDataViewer
        title="Payload audit trail sin procesar"
        subtitle={`GET /api/v1/proyectos/${proyectoId}/audit-trail`}
        loading={trailLoading}
        error={trailError}
        data={trailData}
        onRetry={() => void loadTrail()}
      />

      <GlassCard hover={false} className="space-y-4 border border-amber-500/35 p-6">
        <h2 className="text-lg font-bold text-white">VERIFY audit chain</h2>
        <p className="text-sm text-zinc-400">
          Ejecuta comprobación de cadena / notarización según rutas esperadas por el gateway NADAKKI.
        </p>
        <button
          type="button"
          className="inline-flex min-h-11 items-center rounded-2xl border border-amber-400/55 bg-gradient-to-r from-amber-500 to-yellow-400 px-4 py-2 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-500/30 transition hover:brightness-110 disabled:opacity-40"
          disabled={verifyBusy || !tid}
          onClick={() => void runVerify()}
        >
          {verifyBusy ? "Verificando…" : "Ejecutar VERIFY"}
        </button>
        {verifyBanner ? (
          <div className="rounded-xl border border-amber-500/35 bg-amber-500/[0.12] px-4 py-3 text-sm text-amber-50">{verifyBanner}</div>
        ) : null}
        {verifyBusy ? <div className="animate-pulse h-28 rounded-xl bg-white/10" aria-busy /> : null}
        {!verifyBusy && verifyData !== undefined && verifyData !== null ? (
          <pre className="max-h-64 overflow-auto rounded-xl border border-white/15 bg-black/40 p-4 text-[11px] text-emerald-100/95">
            {verifyPreview || "Sin cuerpo JSON"}
          </pre>
        ) : null}
      </GlassCard>
    </div>
  );
}
