"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { Shuffle } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import { getEscenarios } from "@/app/hooks/useProyectos";
import { ProyectosDataViewer } from "@/components/proyectos/ProyectosDataViewer";
import { BP_ACCENTS } from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";

export function EscenariosClient({ proyectoId }: { proyectoId: string }) {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<unknown | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      setData(await getEscenarios(tid, proyectoId));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("Fallo al cargar escenarios"));
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
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <GlassCard hover={false} className="flex gap-4 p-6">
          <Shuffle className="h-10 w-10 text-amber-300" aria-hidden />
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
              Simulaciones blueprint
            </p>
            <h1 className="text-2xl font-bold text-white">Escenarios</h1>
            <p className="mt-2 text-sm text-zinc-400">Explora combinaciones económicas / de obra — payload JSON listo para motor What-if.</p>
          </div>
        </GlassCard>
      </motion.div>

      <ProyectosDataViewer
        title="Escenarios (respuesta servidor)"
        subtitle={`GET /api/v1/proyectos/{id}/escenarios`}
        loading={loading}
        error={error}
        data={data}
        onRetry={() => void load()}
      />
    </div>
  );
}
