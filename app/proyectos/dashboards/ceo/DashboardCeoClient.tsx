"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { BarChart3 } from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
} from "recharts";
import GlassCard from "@/components/ui/GlassCard";
import NavigationBar from "@/components/ui/NavigationBar";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  BP_ACCENTS,
  averageViability,
  countByProjectState,
  displayProjectName,
  parseProjectsList,
  sumBudgetMinor,
} from "@/components/proyectos/blueprint-projects-helpers";
import { useForgeProjectsTenantId } from "@/components/proyectos/useForgeProjectsTenantId";
import { ProyectosDisclaimerBanner } from "@/components/proyectos/ProyectosDisclaimerBanner";
import { ProyectosSpecialistReviewBanner } from "@/components/proyectos/ProyectosSpecialistReviewBanner";
import { getPortafolio, listProyectos } from "@/app/hooks/useProyectos";

const CHART_AMBER = ["#f59e0b", "#fbbf24", "#fcd34d", "#d97706", "#f97316", "#fde68a"];

interface DashboardCombined {
  portfolio: unknown | null;
  list: unknown | null;
}

function buildPayload(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "ceo",
    portfolio: parts.portfolio,
    projects_list: parts.list,
  };
}

/** CAP-92 — CEO con Recharts alimentado por cartera viva. */
export function DashboardCeoClient() {
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
      setData(buildPayload({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard CEO"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = useMemo(() => parseProjectsList(data?.projects_list ?? null), [data]);
  const stateDistribution = useMemo(() => {
    const counted = countByProjectState(projects);
    return Object.entries(counted).map(([name, value]) => ({ name, value }));
  }, [projects]);

  const budgetBars = useMemo(
    () =>
      projects.map((p) => ({
        name:
          displayProjectName(p).length > 14
            ? `${displayProjectName(p).slice(0, 13)}…`
            : displayProjectName(p),
        value: sumBudgetMinor([p]) / 1_000_000 || 0,
      })),
    [projects],
  );

  const healthScore = useMemo(() => {
    const avg = averageViability(projects);
    if (avg == null) return 78;
    return Math.min(98, Math.round(60 + avg * 8));
  }, [projects]);

  const radialSeries = useMemo(
    () => [{ name: "Salud", value: healthScore, fill: BP_ACCENTS.primary }],
    [healthScore],
  );

  const pieData =
    stateDistribution.length > 0 ? stateDistribution : [{ name: "INTAKE", value: 1 }];

  const totalM = useMemo(() => sumBudgetMinor(projects) / 1_000_000, [projects]);

  return (
    <div className="pb-14">
      <NavigationBar title="" backHref="/proyectos">
        <StatusBadge label="Ejecutivo" status="active" pulse size="md" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="text-3xl font-extrabold text-white">Dashboard CEO</h1>
        <p className="mt-2 max-w-2xl text-sm text-zinc-400">
          Paneles pulsando con tus obras NADAKKI-demo: presiones de budget, dispersión estado y radial de vitalidad modelo.
        </p>
      </motion.div>

      <div className="mb-8 grid gap-4 lg:grid-cols-2">
        <ProyectosDisclaimerBanner variant="compact" />
        <ProyectosSpecialistReviewBanner variant="compact" />
      </div>

      <div className="mb-6 flex flex-wrap gap-4 text-xs">
        <Link href="/proyectos/portafolio" className="text-amber-200 underline-offset-4 hover:text-amber-50 hover:underline">
          Vista portafolio (cards obra)
        </Link>
      </div>

      {loading ? (
        <p className="text-zinc-400">Construyendo storyboard ejecutivo…</p>
      ) : error ? (
        <GlassCard hover={false} className="border border-rose-500/35 p-5 text-sm text-rose-100">{error.message}</GlassCard>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-5 md:grid-cols-3">
            <StatCard
              value={projects.length}
              label="Proyectos bajo lupa"
              color={BP_ACCENTS.primary}
              icon={<BarChart3 className="h-6 w-6 text-amber-400" />}
              delay={0.05}
            />
            <StatCard
              value={totalM >= 1 ? `$${totalM.toFixed(0)}M` : "—"}
              label="CAPEX agregado (modelo)"
              color={BP_ACCENTS.glow}
              delay={0.1}
            />
            <StatCard
              value={`${healthScore}%`}
              label="Salud portafolio (viabilidad media)"
              color="#fcd34d"
              delay={0.15}
            />
          </div>

          <div className="mb-10 grid gap-6 lg:grid-cols-2">
            <GlassCard hover={false} className="p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-amber-200/90">Presupuesto por obra</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={budgetBars.length ? budgetBars : [{ name: "—", value: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis dataKey="name" tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                    <YAxis tick={{ fill: "#a1a1aa", fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ background: "#18181b", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 12 }}
                      labelStyle={{ color: "#fef3c7" }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} fill={BP_ACCENTS.primary} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-5">
              <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-amber-200/90">Salud · radial dinámico</h2>
              <div className="h-[280px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RadialBarChart
                    innerRadius="55%"
                    outerRadius="100%"
                    data={radialSeries}
                    startAngle={90}
                    endAngle={-270}
                  >
                    <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                    <RadialBar background dataKey="value" cornerRadius={10} animationDuration={1000} />
                    <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" className="fill-amber-100 text-3xl font-bold">
                      {healthScore}%
                    </text>
                  </RadialBarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>

            <GlassCard hover={false} className="p-5">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.16em] text-amber-200/90">Distribución por estado</h2>
            <div className="mx-auto h-[300px] w-full max-w-md">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" outerRadius={110} animationDuration={900}>
                    {pieData.map((entry, i) => (
                      <Cell key={`${entry.name}-${i}`} fill={CHART_AMBER[i % CHART_AMBER.length]} stroke="rgba(255,255,255,0.06)" strokeWidth={1} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "#18181b", border: "1px solid rgba(245,158,11,0.35)", borderRadius: 12 }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </GlassCard>
        </>
      )}
    </div>
  );
}
