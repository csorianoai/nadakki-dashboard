"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { ClipboardList } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import NavigationBar from "@/components/ui/NavigationBar";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  BP_ACCENTS,
  displayProjectName,
  parseProjectsList,
  sumBudgetMinor,
} from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import { ProyectosDisclaimerBanner } from "@/components/proyectos/ProyectosDisclaimerBanner";
import { ProyectosSpecialistReviewBanner } from "@/components/proyectos/ProyectosSpecialistReviewBanner";
import { getPortafolio, listProyectos } from "@/app/hooks/useProyectos";
import { PROYECTO_STATES } from "@/lib/projects/types";

interface DashboardCombined {
  portfolio: unknown | null;
  list: unknown | null;
}

function payloadPm(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "pm",
    emphasis: ["plazos entregables", "dependencias WBS"],
    portfolio: parts.portfolio,
    backlog_signal: parts.list,
  };
}

/** CAP-93 · PM operativo · timeline sintético desde estados ciclo obra. */
export function DashboardPmClient() {
  const tid = useForgeProjectsTenantId();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<Record<string, unknown> | null>(null);

  const load = useCallback(async () => {
    if (!tid) return;
    setLoading(true);
    setError(null);
    try {
      const [pf, lst] = await Promise.all([getPortafolio(tid).catch(() => null), listProyectos(tid)]);
      setData(payloadPm({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard PM"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = useMemo(() => parseProjectsList(data?.backlog_signal ?? null), [data]);

  const phaseScores = useMemo(() => {
    return projects.map((p, idx) => {
      const raw = typeof p.state === "string" ? p.state.toUpperCase() : "";
      let score = 40;
      const pos = raw ? PROYECTO_STATES.indexOf(raw as (typeof PROYECTO_STATES)[number]) : -1;
      if (pos >= 0) score = Math.min(96, Math.round(((pos + 1) / PROYECTO_STATES.length) * 100));
      return {
        obra: `${displayProjectName(p).slice(0, 10)}`,
        idx: idx + 1,
        avance: score,
      };
    });
  }, [projects]);

  const lineData = useMemo(
    () =>
      projects.map((p, i) => ({
        iteración: `#${i + 1}`,
        presión: sumBudgetMinor([p]) / 1_000_000 || 0,
      })),
    [projects],
  );

  return (
    <div className="pb-14">
      <NavigationBar title="" backHref="/proyectos">
        <StatusBadge label="PM · Operativo" status="warning" pulse size="md" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <h1 className="text-3xl font-extrabold text-white">Dashboard Project Manager</h1>
        <p className="mt-2 text-sm text-zinc-400">Lentes operativos: burndown presupuesto, barras por fases y tabla de obra crítica.</p>
      </motion.div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <ProyectosDisclaimerBanner variant="compact" />
        <ProyectosSpecialistReviewBanner variant="compact" />
      </div>

      <Link href="/proyectos" className="mb-8 inline-block text-sm text-amber-200 underline underline-offset-4 hover:text-amber-50">
        ← Panel Projects
      </Link>

      {loading ? (
        <p className="text-zinc-500">Cableando sala de obra…</p>
      ) : error ? (
        <GlassCard hover={false} className="border border-rose-500/40 p-5 text-sm text-rose-100">{error.message}</GlassCard>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <StatCard
              value={projects.length}
              label="Lotes supervisados"
              color={BP_ACCENTS.primary}
              icon={<ClipboardList className="h-6 w-6 text-amber-300" />}
              delay={0.05}
            />
            <StatCard
              value={
                phaseScores.length
                  ? `${Math.round(phaseScores.reduce((s, x) => s + x.avance, 0) / phaseScores.length)}%`
                  : "—"
              }
              label="Avance medio por máquina de estados"
              color="#fcd34d"
              delay={0.1}
            />
          </div>

          <div className="mb-10 grid gap-6 xl:grid-cols-2">
            <GlassCard hover={false} className="p-5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: BP_ACCENTS.glow }}>
                Línea de presión financiera por iteración obra
              </h2>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={lineData.length ? lineData : [{ iteración: "—", presión: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="iteración" stroke="#71717a" fontSize={11} />
                    <YAxis stroke="#71717a" fontSize={11} />
                    <Tooltip contentStyle={{ background: "#09090b", border: `1px solid ${BP_ACCENTS.primary}55`, borderRadius: 14 }} />
                    <Line type="monotone" dataKey="presión" stroke={BP_ACCENTS.primary} strokeWidth={3} dot={{ r: 4 }} animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-5">
              <h2 className="mb-4 text-xs font-bold uppercase tracking-[0.18em]" style={{ color: BP_ACCENTS.glow }}>
                Barras de madurez por proyecto
              </h2>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={phaseScores.length ? phaseScores : [{ obra: "—", idx: 0, avance: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="obra" stroke="#71717a" tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <YAxis stroke="#71717a" domain={[0, 100]} tick={{ fill: "#a1a1aa", fontSize: 10 }} />
                    <Tooltip contentStyle={{ background: "#09090b", border: `1px solid ${BP_ACCENTS.primary}44`, borderRadius: 14 }} />
                    <Bar dataKey="avance" radius={[8, 8, 2, 2]} fill="url(#pmGradFill)" animationDuration={1000} />
                    <defs>
                      <linearGradient id="pmGradFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#fcd34d" />
                        <stop offset="100%" stopColor="#b45309" />
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

          <GlassCard hover={false} className="p-6">
            <h2 className="mb-4 text-sm font-bold text-white">Tabla de obra crítica</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-zinc-200">
                <thead>
                  <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-500">
                    <th className="py-3">Proyecto</th>
                    <th className="py-3">Estado</th>
                    <th className="py-3 text-right">Presupuesto modelo (MUSD)</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr key={p.id || i} className="border-b border-white/5 hover:bg-white/[0.04]">
                      <td className="py-3 font-semibold">{displayProjectName(p)}</td>
                      <td className="py-3 text-amber-200/95">{String(p.state ?? "—")}</td>
                      <td className="py-3 text-right font-mono">{((sumBudgetMinor([p]) || 0) / 1_000_000).toFixed(1)}</td>
                    </tr>
                  ))}
                  {!projects.length ? (
                    <tr>
                      <td colSpan={3} className="py-8 text-center text-zinc-500">
                        Sin obra reportada por PMO todavía.
                      </td>
                    </tr>
                  ) : null}
                </tbody>
              </table>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
