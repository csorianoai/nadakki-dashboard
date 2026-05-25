"use client";

import { use } from "react";
import { motion } from "@/lib/motion-stub";
import { Loader2 } from "lucide-react";
import { Button, Skeleton } from "@/components/forge";
import { ProyectoCommandCenterView } from "@/components/proyectos/ProyectoCommandCenterView";
import GlassCard from "@/components/ui/GlassCard";
import { useProyecto } from "@/hooks/projects/useProyectos";
import { ProjectsApiError } from "@/lib/projects/projectsClient";

export default function ProyectoCommandCenterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const query = useProyecto(decodeURIComponent(id));

  if (query.isPending) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <GlassCard hover={false} className="border border-white/10 p-10">
          <div className="flex flex-col items-center justify-center gap-4 py-12 text-center text-zinc-300">
            <Loader2 className="h-9 w-9 animate-spin text-amber-300/85" aria-hidden />
            <p className="text-sm text-zinc-400">Construyendo el command center desde el core…</p>
          </div>
        </GlassCard>
        <Skeleton className="h-72 w-full rounded-forge-lg" />
      </motion.div>
    );
  }

  if (query.isError || !query.data) {
    const detail = query.error instanceof ProjectsApiError ? query.error.message : undefined;
    return (
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <GlassCard hover={false} className="mx-auto max-w-lg border border-rose-500/35 bg-gradient-to-br from-rose-950/40 via-white/[0.04] to-transparent p-8 text-center backdrop-blur-xl">
          <p className="text-sm font-semibold text-rose-100">No se pudo cargar este proyecto.</p>
          {detail ? <p className="mt-2 font-forgeMono text-[11px] text-rose-200/85">{detail}</p> : null}
          <Button type="button" variant="secondary" className="mt-6 min-h-11 border-white/15 bg-white/10 text-white hover:bg-white/15" onClick={() => void query.refetch()}>
            Reintentar
          </Button>
        </GlassCard>
      </motion.div>
    );
  }

  return <ProyectoCommandCenterView proyecto={query.data} />;
}
