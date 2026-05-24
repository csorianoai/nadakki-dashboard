"use client";

import Link from "next/link";
import { motion } from "@/lib/motion-stub";
import { Layers, Radar } from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import NavigationBar from "@/components/ui/NavigationBar";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  BP_ACCENTS,
  displayProjectName,
  formatBudgetMillionsUsd,
  proyectoStateBadgeStatus,
} from "@/components/proyectos/blueprint-projects-helpers";
import { ProyectosDisclaimerBanner } from "@/components/proyectos/ProyectosDisclaimerBanner";
import { ProyectosSpecialistReviewBanner } from "@/components/proyectos/ProyectosSpecialistReviewBanner";
import { useProyectos } from "@/hooks/projects/useProyectos";

function progressFromState(state: string | null | undefined): number {
  const s = (state ?? "").toUpperCase();
  const order = ["INTAKE", "SCOPING", "PLANNING", "ACTIVE", "ON_HOLD", "REVIEW", "FINANCE_REVIEW"];
  const idx = order.indexOf(s);
  return idx >= 0 ? Math.min(96, Math.round(((idx + 1) / order.length) * 100)) : 42;
}

/** CAP-91 — Vista de cartera navegable tipo CORE_MODULES blueprint. */
export function PortafolioClient() {
  const { data: proyectos, isPending } = useProyectos();
  const rows = proyectos ?? [];

  return (
    <div className="pb-14">
      <NavigationBar title="" backHref="/proyectos">
        <StatusBadge status="active" label="Portafolio obra" pulse size="md" />
      </NavigationBar>
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: BP_ACCENTS.glow }}>
            Blueprint vivo
          </p>
          <h1 className="mt-1 text-3xl font-extrabold text-white">Portafolio inmobiliario</h1>
          <p className="mt-2 max-w-2xl text-sm text-zinc-400">
            Mosaicos de proyecto con estado, presupuesto sembrado en vivo — pulsa cualquier obra para abrir la mesa táctica `[id]`.
          </p>
        </div>
        <Radar className="h-14 w-14 text-amber-400 opacity-85" aria-hidden />
      </div>

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <ProyectosDisclaimerBanner />
        <ProyectosSpecialistReviewBanner />
      </div>

      {isPending ? (
        <div className="text-center text-zinc-400">Sincronizando planimetría desde edge…</div>
      ) : rows.length === 0 ? (
        <GlassCard hover={false} className="flex flex-col items-center gap-4 border border-dashed border-amber-500/40 p-14 text-center">
          <Layers className="h-14 w-14 text-amber-300 opacity-85" aria-hidden />
          <p className="text-lg font-semibold text-white">Aquí aparecerían tus obra maestras</p>
          <p className="max-w-md text-sm text-zinc-400">Cadena IAM limpia = zero planos por ahora — sembramos con tu nadakki-demo en segundos.</p>
          <Link href="/proyectos/new" className="rounded-2xl bg-amber-500/90 px-5 py-2.5 text-sm font-bold text-zinc-950 shadow-lg hover:bg-amber-400">
            Nuevo proyecto
          </Link>
        </GlassCard>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
          {rows.map((p, i) => (
            <motion.div
              key={p.id || i}
              initial={{ opacity: 0, y: 26 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * i }}
            >
              <Link href={`/proyectos/${encodeURIComponent(p.id)}`}>
                <GlassCard className="relative h-full p-6 transition hover:border-amber-500/35">
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-2">
                    {p.state ? (
                      <StatusBadge status={proyectoStateBadgeStatus(p.state)} label={String(p.state)} pulse={false} size="sm" />
                    ) : null}
                    <span className="font-mono text-[10px] text-zinc-500">{formatBudgetMillionsUsd(p)}</span>
                  </div>
                  <h2 className="text-lg font-bold text-white transition-colors group-hover:text-amber-200">{displayProjectName(p)}</h2>
                  <p className="mt-1 line-clamp-2 text-xs uppercase tracking-[0.12em] text-zinc-500">{String(p.project_type ?? "TIPO_DESCONOCIDO")}</p>
                  <div className="mt-6">
                    <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <span>Avance ciclo modelo</span>
                      <span className="text-amber-200">{progressFromState(p.state ?? undefined)}%</span>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/5">
                      <motion.div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 to-yellow-400"
                        initial={{ width: 0 }}
                        animate={{ width: `${progressFromState(p.state ?? undefined)}%` }}
                        transition={{ duration: 1, delay: 0.08 * i }}
                      />
                    </div>
                  </div>
                </GlassCard>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
