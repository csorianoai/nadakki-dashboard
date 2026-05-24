"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { Layers } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import { getWbs } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS, asObjectArray, coerceNumber } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

/** Mini-plan por fases — duración modelo si API no tipa duración literal. */
function ganttFromWbs(rows: Record<string, unknown>[]) {
  return rows.slice(0, 12).map((row, idx) => {
    const title = String(row.name ?? row.phase ?? row.label ?? row.title ?? `Hito ${idx + 1}`);
    const dur = coerceNumber(row.duration_days ?? row.estimate_hours ?? row.hours ?? row.weight, (idx % 6) + 4);
    return { fase: title.length > 16 ? `${title.slice(0, 15)}…` : title, dias: dur };
  });
}

export function WbsClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getWbs(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar WBS"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  const rows = useMemo(() => asObjectArray(data), [data]);
  const ganttRows = useMemo(() => {
    const g = ganttFromWbs(rows);
    return g.length ? g : [{ fase: "Plan base", dias: 7 }];
  }, [rows]);

  return (
    <div className="space-y-10 pb-8">
      <Link href={`/proyectos/${encodeURIComponent(proyectoId)}`} className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.15em] text-amber-200 hover:text-white">
        ← Workspace · detalle proyecto
      </Link>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="p-6">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <Layers className="h-9 w-9 text-amber-300" />
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
                WBS blueprint
              </p>
              <h1 className="text-2xl font-bold text-white">Desglose de trabajo</h1>
              <p className="text-sm text-zinc-400">{`Proyecto ${proyectoId}`}</p>
            </div>
          </div>
          <p className="text-sm leading-relaxed text-zinc-400">Mini‑Gantt calibrado cuando el núcleo publica colecciones; los campos nombre/duración se infieren desde el JSON vivo.</p>
        </GlassCard>
      </motion.div>

      <GlassCard hover={false} className="border border-white/12 p-5">
        <h2 className="mb-3 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: BP_ACCENTS.glow }}>
          Ventana técnica (barras horizontales modelo)
        </h2>
        <div className="h-[min(360px,50vh)] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart layout="vertical" data={ganttRows} margin={{ left: 56, right: 16 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
              <XAxis type="number" stroke="#71717a" />
              <YAxis type="category" dataKey="fase" width={120} stroke="#71717a" tick={{ fill: "#d4d4d8", fontSize: 10 }} />
              <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(251,191,36,0.35)" }} />
              <Bar dataKey="dias" fill={BP_ACCENTS.primary} radius={[0, 8, 8, 0]} animationDuration={900} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <ProyectosDataViewer
        title="Payload técnico WBS"
        subtitle={`GET /api/v1/proyectos/{id}/wbs`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
