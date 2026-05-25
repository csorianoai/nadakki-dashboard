"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { MapPinned } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getMasterPlan } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

export function MasterPlanClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getMasterPlan(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar master plan"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid, proyectoId]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <div className="space-y-8 pb-8">
      <Link href={`/proyectos/${encodeURIComponent(proyectoId)}`} className="text-xs font-bold uppercase tracking-[0.14em] text-amber-200 hover:text-white">
        ← Detalle proyecto
      </Link>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
        <GlassCard hover={false} className="flex gap-4 border border-emerald-500/25 p-6">
          <MapPinned className="h-10 w-10 text-emerald-300" />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
              Master lienzo
            </p>
            <h1 className="text-2xl font-bold text-white">Master plan</h1>
            <p className="mt-2 text-sm text-zinc-400">
              Norte estratégico del proyecto sobre fondo dorado NADAKKI — mismo lenguaje que Marketing core.
            </p>
          </div>
        </GlassCard>
      </motion.div>

      <ProyectosDataViewer
        title="Master plan — payload"
        subtitle={`GET /api/v1/proyectos/{id}/master-plan`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
