"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import { TrendingUp } from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
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

interface DashboardCombined {
  portfolio: unknown | null;
  list: unknown | null;
}

function payloadInvestor(parts: DashboardCombined): Record<string, unknown> {
  return {
    role_context: "inversionista",
    disclosures: ["usar disclaimers institucionales"],
    valuation_inputs: parts.portfolio,
    proyectos_outline: parts.list,
  };
}

function viability01(p: { viability_score?: number | null }) {
  const v = typeof p.viability_score === "number" && !Number.isNaN(p.viability_score) ? p.viability_score : 52;
  return Math.min(100, Math.round(v));
}

/** CAP-94 · Inversionista — absorción, valorización, retorno modelo, capex/opex. */
export function DashboardInvestorClient() {
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
      setData(payloadInvestor({ portfolio: pf, list: lst }));
    } catch (e) {
      setError(e instanceof Error ? e : new Error("No se cargó dashboard inversionista"));
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [tid]);

  useEffect(() => {
    void load();
  }, [load]);

  const projects = useMemo(() => parseProjectsList(data?.proyectos_outline ?? null), [data]);

  const absorptionLine = useMemo(() => {
    let cum = 0;
    return projects.map((p, i) => {
      cum += viability01(p);
      return {
        t: `#${i + 1}`,
        absorción: cum / (i + 1),
      };
    });
  }, [projects]);

  const valuationArea = useMemo(() => {
    let cumulative = 0;
    return projects.map((p, i) => {
      const slice = sumBudgetMinor([p]) / 1_000_000;
      cumulative += slice;
      return {
        obra: `${displayProjectName(p).slice(0, 8)}`,
        valuation: cumulative * 1.08,
      };
    });
  }, [projects]);

  const roiBars = useMemo(
    () =>
      projects.map((p) => ({
        name: `${displayProjectName(p).slice(0, 8)}`,
        retorno_pct: viability01(p) * 1.05,
      })),
    [projects],
  );

  const stackData = useMemo(
    () =>
      projects.map((p) => {
        const budgetM = sumBudgetMinor([p]) / 1_000_000;
        const capex = budgetM * 0.62;
        const opex = budgetM * 0.38;
        return { obra: `${displayProjectName(p).slice(0, 8)}`, capex: +capex.toFixed(2), opex: +opex.toFixed(2) };
      }),
    [projects],
  );

  const totalModel = projects.reduce((a, b) => a + sumBudgetMinor([b]) / 1_000_000, 0);

  return (
    <div className="pb-14">
      <NavigationBar title="" backHref="/proyectos">
        <StatusBadge label="Financiero" status="inactive" pulse size="md" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10">
        <h1 className="text-3xl font-extrabold text-white">Dashboard inversionista</h1>
        <p className="mt-2 text-sm text-zinc-400">Modelados ilustrativos derivados del dataset vivo (`viability`, presupuestos modelo).</p>
      </motion.div>

      <div className="mb-10 grid gap-4 lg:grid-cols-2">
        <ProyectosDisclaimerBanner />
        <ProyectosSpecialistReviewBanner />
      </div>

      <Link href="/proyectos" className="mb-8 inline-block text-sm text-amber-100 underline underline-offset-4 hover:text-white">
        ← Projects
      </Link>

      {loading ? (
        <p className="text-zinc-500">Cargando dossier IRR…</p>
      ) : error ? (
        <GlassCard hover={false} className="border border-rose-500/40 p-5 text-sm text-rose-100">{error.message}</GlassCard>
      ) : (
        <>
          <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2">
            <StatCard
              value={`$${totalModel.toFixed(0)}M`}
              label="Cartera agregada (modelo vivo)"
              color={BP_ACCENTS.primary}
              icon={<TrendingUp className="h-7 w-7 text-amber-300" />}
              delay={0.05}
            />
            <StatCard
              value={projects.length ? `${viability01(projects[projects.length - 1]!)} pts` : "—"}
              label="Viability sentinel (último proyecto)"
              color="#fcd34d"
              delay={0.1}
            />
          </div>

          <div className="mb-10 grid gap-6 xl:grid-cols-3">
            <GlassCard hover={false} className="p-4 xl:col-span-1">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/95">Absorción (línea)</h2>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={absorptionLine.length ? absorptionLine : [{ t: "-", absorción: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="t" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(251,191,36,0.35)" }} />
                    <Line type="monotone" dataKey="absorción" stroke="#fbbf24" strokeWidth={2} dot animationDuration={1000} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-4 xl:col-span-2">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/95">Valorización cumulativa (área)</h2>
              <div className="h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={valuationArea.length ? valuationArea : [{ obra: "-", valuation: 0 }]}>
                    <defs>
                      <linearGradient id="valGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={BP_ACCENTS.primary} stopOpacity={0.8} />
                        <stop offset="100%" stopColor={BP_ACCENTS.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="obra" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(245,158,11,0.35)" }} />
                    <Area type="monotone" dataKey="valuation" stroke={BP_ACCENTS.glow} fill="url(#valGrad)" animationDuration={1050} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-4 xl:col-span-3">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/95">Retorno proyectado (barras)</h2>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roiBars.length ? roiBars : [{ name: "-", retorno_pct: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="name" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(245,158,11,0.35)" }} />
                    <Bar dataKey="retorno_pct" fill={BP_ACCENTS.primary} radius={[8, 8, 4, 4]} animationDuration={900} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>

            <GlassCard hover={false} className="p-4 xl:col-span-3">
              <h2 className="mb-2 text-xs font-bold uppercase tracking-[0.18em] text-amber-200/95">CAPEX vs OPEX (stacked modelo 62/38)</h2>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={stackData.length ? stackData : [{ obra: "-", capex: 0, opex: 0 }]}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="obra" stroke="#71717a" />
                    <YAxis stroke="#71717a" />
                    <Tooltip contentStyle={{ background: "#09090b", border: "1px solid rgba(245,158,11,0.35)" }} />
                    <Legend wrapperStyle={{ color: "#fafafa", fontSize: 12 }} />
                    <Bar stackId="a" dataKey="capex" fill="#fcd34d" animationDuration={800} radius={[8, 8, 0, 0]} />
                    <Bar stackId="a" dataKey="opex" fill="#b45309" animationDuration={800} radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </GlassCard>
          </div>
        </>
      )}
    </div>
  );
}
