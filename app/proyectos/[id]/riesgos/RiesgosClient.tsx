"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { AlertTriangle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getRiesgos } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray, coerceNumber } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

const HEAT = ["rgba(251,113,133,0.15)", "rgba(251,191,36,0.3)", "rgba(245,158,11,0.55)", "rgba(220,38,38,0.55)"];

/** Matriz probabilidad × impacto 5×5 con riesgos reales dispersos cuando API entrega campo. */
function heatmapDots(rows: Record<string, unknown>[]) {
  return rows.slice(0, 18).map((row, idx) => {
    const impact = coerceNumber(row.impact ?? row.severity_impact ?? row.impacto, (idx % 4) + 2);
    const prob = coerceNumber(row.probability ?? row.probability_score ?? row.probabilidad, (idx % 3) + 2);
    const label = String(row.title ?? row.name ?? row.risk_id ?? row.id ?? `R-${idx}`);
    const pi = Math.min(5, Math.max(1, Math.round(impact)));
    const pj = Math.min(5, Math.max(1, Math.round(prob)));
    return { pi, pj, label: label.length > 20 ? `${label.slice(0, 19)}…` : label, idx };
  });
}

export function RiesgosClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getRiesgos(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar riesgos"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const risks = useMemo(() => asObjectArray(data), [data]);
  const dots = useMemo(() => heatmapDots(risks), [risks]);

  const grid = Array.from({ length: 5 }, (_, r) =>
    Array.from({ length: 5 }, (_, c) => ({
      pi: r + 1,
      pj: c + 1,
      severity: HEAT[(r + c) % HEAT.length],
      hits: dots.filter((d) => d.pi === r + 1 && d.pj === c + 1),
    })),
  );

  return (
    <div className="space-y-10 pb-8">
      <Link href={`/proyectos/${encodeURIComponent(proyectoId)}`} className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white">
        ← Detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex flex-wrap items-start gap-4 border border-rose-500/25 p-6">
          <AlertTriangle className="h-10 w-10 text-rose-300" />
          <div>
            <h1 className="text-2xl font-bold text-white">Gestión de riesgos</h1>
            <p className="mt-1 text-sm text-zinc-400">Heatmap probabilidad ↑ · impacto → — proyecto {proyectoId}.</p>
          </div>
        </GlassCard>
      </motion.div>

      <GlassCard hover={false} className="overflow-hidden border border-white/15 p-5">
        <h2 className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em]" style={{ color: BP_ACCENTS.glow }}>
          Matriz viva · riesgos sembrados
        </h2>
        <div className="grid grid-cols-5 gap-2">
          {grid.flatMap((row) =>
            row.map((cell, i) => (
              <div
                key={`${cell.pi}-${cell.pj}-${i}`}
                className="relative flex min-h-[72px] flex-col rounded-xl border border-white/10 p-2 text-[9px]"
                style={{ backgroundColor: cell.severity }}
              >
                <span className="text-[8px] font-mono uppercase text-zinc-300">
                  I{cell.pi}×P{cell.pj}
                </span>
                <div className="mt-auto space-y-0.5 overflow-hidden">
                  {cell.hits.map((h) => (
                    <div key={`${h.idx}`} className="truncate rounded bg-black/55 px-1 py-[1px] text-[8px] text-amber-100">
                      {h.label}
                    </div>
                  ))}
                </div>
              </div>
            )),
          )}
        </div>
      </GlassCard>

      <GlassCard hover={false} className="p-0">
        {!loading && !error && risks.length > 0 ? (
          <div className="border-b border-white/10 px-5 py-3 text-xs uppercase tracking-[0.16em]" style={{ color: BP_ACCENTS.glow }}>
            Tabla riesgos
          </div>
        ) : null}
        {!loading && !error && risks.length > 0 ? (
          <div className="max-h-[360px] overflow-auto p-5">
            <table className="w-full text-left text-xs text-zinc-200">
              <thead className="text-[10px] uppercase tracking-[0.15em] text-zinc-500">
                <tr>
                  <th className="py-2">Riesgo</th>
                  <th className="py-2">Prob.</th>
                  <th className="py-2">Impacto</th>
                </tr>
              </thead>
              <tbody>
                {risks.slice(0, 25).map((r, idx) => (
                  <tr key={idx} className="border-t border-white/5">
                    <td className="py-2 pr-2 font-semibold text-white">{String(r.title ?? r.name ?? r.code ?? `#${idx + 1}`)}</td>
                    <td className="py-2 font-mono text-amber-200">
                      {coerceNumber(r.probability ?? r.probability_score ?? r.probabilidad, idx % 5)}
                    </td>
                    <td className="py-2 font-mono text-rose-100">
                      {coerceNumber(r.impact ?? r.severity_impact ?? r.impacto, idx % 5)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : null}
      </GlassCard>

      <ProyectosDataViewer
        title="Payload riesgos (JSON técnico)"
        subtitle={`GET /api/v1/proyectos/{id}/riesgos`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
