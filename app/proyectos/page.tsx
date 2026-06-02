"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { motion } from "@/lib/motion-stub";
import {
  Activity,
  Building2,
  FolderKanban,
  Loader2,
  PencilRuler,
  Plus,
  Radar,
  Sparkles,
} from "lucide-react";
import GlassCard from "@/components/ui/GlassCard";
import StatCard from "@/components/ui/StatCard";
import StatusBadge from "@/components/ui/StatusBadge";
import NavigationBar from "@/components/ui/NavigationBar";
import {
  BP_ACCENTS,
  aggregateBudgetMillions,
  displayProjectName,
  formatBudgetMillionsUsd,
  proyectoStateBadgeStatus,
} from "@/components/proyectos/blueprint-projects-helpers";
import { useAnimatedCount } from "@/components/proyectos/useAnimatedMetric";
import { useProyectoHealth, useProyectos } from "@/hooks/projects/useProyectos";
import { ProjectsApiError } from "@/lib/projects/projectsClient";
import type { Proyecto } from "@/lib/projects/types";

const LOADING_TIMEOUT_MS = 10_000;

function friendlyProjectsError(error: unknown): { title: string; detail: string } {
  if (error instanceof ProjectsApiError) {
    if (error.status === 401)
      return { title: "Sesion expirada", detail: "Tu token de acceso ya no es valido. Reintenta o inicia sesion de nuevo." };
    if (error.status === 403)
      return { title: "Sin permisos", detail: "No tienes acceso a los proyectos de este tenant." };
    if (error.status >= 500)
      return { title: "Error de servidor", detail: "El backend no pudo procesar la solicitud. Intenta de nuevo en unos momentos." };
    if (error.status === 408 || error.status === 0)
      return { title: "Sin conexion", detail: "No se pudo conectar con el servidor. Verifica tu conexion a internet." };
  }
  if (error instanceof Error && /failed to fetch|network/i.test(error.message))
    return { title: "Sin conexion", detail: "No se pudo conectar con el servidor. Verifica tu conexion a internet." };
  return { title: "Error cargando proyectos", detail: "Ocurrio un error inesperado. Intenta de nuevo." };
}

const QUICK_LINKS = [
  {
    id: "portafolio",
    name: "Portafolio",
    desc: "Vista navegable del blueprint de cartera con cards por obra.",
    href: "/proyectos/portafolio",
    icon: Radar,
    color: BP_ACCENTS.primary,
    badge: "VIVO",
    features: ["Cards", "Progreso", "Presupuesto"],
  },
  {
    id: "ceo",
    name: "Dashboard CEO",
    desc: "KPI ejecutivos, salud aggregate y distribución Estados.",
    href: "/proyectos/dashboards/ceo",
    icon: Sparkles,
    color: BP_ACCENTS.glow,
    badge: "EXEC",
    features: ["Barras", "Radial", "Donut"],
  },
  {
    id: "pm",
    name: "Dashboard PM",
    desc: "Líneas de obra, barras por fases y tabla operativa.",
    href: "/proyectos/dashboards/pm",
    icon: Building2,
    color: "#fcd34d",
    badge: "OPS",
    features: ["Timeline", "Fases", "Tareas"],
  },
  {
    id: "inv",
    name: "Dashboard Inversionista",
    desc: "Absorción, valorización, retorno proyectado.",
    href: "/proyectos/dashboards/inversionista",
    icon: FolderKanban,
    color: "#fbbf24",
    badge: "FIN",
    features: ["Líneas", "Áreas", "Stack"],
  },
] as const;

export default function ProyectosDashboardPage() {
  const { data: proyectos, isPending, isError, error, refetch } = useProyectos();
  const health = useProyectoHealth();
  const [loadingSlow, setLoadingSlow] = useState(false);

  useEffect(() => {
    if (!isPending) { setLoadingSlow(false); return; }
    const timer = window.setTimeout(() => setLoadingSlow(true), LOADING_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [isPending]);

  const rows = proyectos ?? [];
  const activeCount = useMemo(
    () => rows.filter((p) => typeof p.state === "string" && p.state === "ACTIVE").length,
    [rows],
  );
  const inFlight = useMemo(
    () =>
      rows.filter((p) => {
        const s = typeof p.state === "string" ? p.state : "";
        return s && s !== "CERRADO" && s !== "ON_HOLD";
      }).length,
    [rows],
  );

  const friendlyError = isError ? friendlyProjectsError(error) : null;

  const healthOk =
    health.data !== undefined && !health.isError && !health.isPending;
  const budgetAgg = aggregateBudgetMillions(rows);
  const nTotalAnimated = useAnimatedCount(rows.length, 780);
  const nActiveAnimated = useAnimatedCount(activeCount, 900);
  const nFlightAnimated = useAnimatedCount(inFlight, 760);

  const renderModuleCard = (m: (typeof QUICK_LINKS)[number], i: number) => (
    <motion.div
      key={m.id}
      initial={{ opacity: 0, y: 22 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 + i * 0.07 }}
    >
      <Link href={m.href}>
        <GlassCard className="group relative h-full cursor-pointer p-5 transition-all hover:border-amber-500/35 hover:shadow-lg hover:shadow-amber-500/15">
          {m.badge ? (
            <span className="absolute right-3 top-3 rounded-full bg-amber-500/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-200 ring-1 ring-amber-400/30">
              {m.badge}
            </span>
          ) : null}
          <div className="flex items-start gap-4">
            <div className="rounded-xl p-3" style={{ backgroundColor: `${m.color}25` }}>
              <m.icon className="h-6 w-6" style={{ color: m.color }} aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-white transition-colors group-hover:text-amber-200">{m.name}</h3>
              <p className="mt-1 text-sm leading-snug text-zinc-400">{m.desc}</p>
              {m.features && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {m.features.slice(0, 4).map((f) => (
                    <span key={f} className="rounded-full bg-white/5 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-zinc-500">
                      {f}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </GlassCard>
      </Link>
    </motion.div>
  );

  return (
    <div className="pb-14">
      <NavigationBar title="" backHref="/">
        <StatusBadge status="active" label="Projects Core · Blueprint vivo" pulse size="lg" />
      </NavigationBar>

      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} className="mb-10 flex flex-wrap items-start justify-between gap-6">
        <div className="flex flex-wrap gap-5">
          <div className="rounded-3xl bg-gradient-to-br from-amber-500/25 to-transparent p-[1px] shadow-[0_0_56px_-8px_rgba(245,158,11,0.55)]">
            <div className="rounded-3xl bg-zinc-950/80 px-6 py-5 backdrop-blur-md">
              <div className="flex items-center gap-4">
                <div className="rounded-2xl border border-amber-400/30 bg-gradient-to-br from-amber-500/20 to-amber-600/10 p-4 shadow-inner">
                  <PencilRuler className="h-11 w-11 text-amber-300" aria-hidden />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: BP_ACCENTS.glow }}>
                    Blueprint vivo · Nadakki
                  </p>
                  <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-white">Projects Core</h1>
                  <p className="mt-2 max-w-xl text-sm text-zinc-400">
                    Mesa de obra digital: KPIs poblados en vivo, lienzo técnico y tableros de cartera sobre `/api/v1/proyectos`.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }}>
          <Link
            href="/proyectos/new"
            className="inline-flex min-h-[48px] items-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-400 to-yellow-400 px-5 py-3 text-sm font-bold text-zinc-950 shadow-xl shadow-amber-500/35 transition hover:scale-[1.02]"
          >
            <Plus className="h-4 w-4" /> Nuevo proyecto
          </Link>
        </motion.div>
      </motion.div>

      {health.isError ? (
        <div className="mb-8 rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
          {(health.error as Error | null)?.message ?? "Salud Projects API sin respuesta"}
        </div>
      ) : null}

      {isError && friendlyError ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <GlassCard hover={false} className="border border-rose-500/35 bg-rose-500/[0.08] p-6">
            <p className="text-lg font-bold text-rose-100">{friendlyError.title}</p>
            <p className="mt-2 text-sm text-rose-200/90">{friendlyError.detail}</p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="mt-4 rounded-xl border border-white/15 bg-white/10 px-5 py-2 text-sm font-semibold text-white transition hover:bg-white/15"
            >
              Reintentar
            </button>
          </GlassCard>
        </motion.div>
      ) : null}

      <div className="mb-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          delay={0.05}
          value={isPending ? "…" : nTotalAnimated}
          label="Proyectos en cartera"
          color={BP_ACCENTS.primary}
          icon={isPending ? <Loader2 className="h-7 w-7 animate-spin" style={{ color: BP_ACCENTS.primary }} aria-hidden /> : <FolderKanban className="h-7 w-7" style={{ color: BP_ACCENTS.primary }} aria-hidden />}
        />
        <StatCard
          delay={0.1}
          value={isPending ? "…" : nFlightAnimated}
          label="Activos · en ciclo obra"
          color={BP_ACCENTS.glow}
          icon={<Activity className="h-7 w-7" style={{ color: BP_ACCENTS.glow }} aria-hidden />}
        />
        <StatCard
          delay={0.15}
          value={isPending ? "…" : nActiveAnimated}
          label="Ejecución directa (ACTIVE)"
          color="#fcd34d"
          icon={<Sparkles className="h-7 w-7 text-[#fcd34d]" aria-hidden />}
        />
        <StatCard
          delay={0.2}
          value={budgetAgg}
          label="CAPEX agregado (modelo vivo)"
          color="#fbbf24"
          icon={<Building2 className="h-7 w-7 text-[#fbbf24]" aria-hidden />}
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-4">
        <GlassCard hover={false} className="flex items-center gap-4 p-5 md:col-span-1">
          {healthOk ? (
            <>
              <StatusBadge status="active" label={`Health API · OK`} size="lg" />
              <p className="text-xs uppercase tracking-[0.12em] text-zinc-500">GET `/api/v1/proyectos/health` respondiendo</p>
            </>
          ) : health.isPending ? (
            <>
              <StatusBadge status="loading" pulse size="md" />
              <p className="text-xs text-zinc-500">Midiendo pulso técnico…</p>
            </>
          ) : (
            <>
              <StatusBadge status="error" label="/health" size="md" pulse={false} />
              <p className="text-xs text-zinc-500">{health.error?.message ?? "Sin respuesta estable"}</p>
            </>
          )}
        </GlassCard>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 flex items-center gap-3">
        <Activity className="h-6 w-6 text-amber-400" aria-hidden />
        <h2 className="text-xl font-bold text-white">Enlaces core</h2>
      </motion.div>
      <div className="mb-14 grid gap-6 sm:grid-cols-2">{QUICK_LINKS.map((m, i) => renderModuleCard(m, i))}</div>

      <GlassCard hover={false} className="overflow-hidden border border-white/15 p-0">
        <div className="border-b border-white/10 px-6 py-4 bg-gradient-to-r from-amber-500/10 via-transparent">
          <h2 className="text-lg font-bold text-white">Cartera viva · tabla ejecutiva</h2>
          <p className="text-xs uppercase tracking-[0.16em]" style={{ color: BP_ACCENTS.glow }}>
            Datos proyectados desde NADAKKI Projects Core
          </p>
        </div>
        <div className="overflow-x-auto p-4 pb-8">
          {isPending ? (
            <div className="flex h-40 flex-col items-center justify-center gap-3 text-zinc-500">
              <div className="flex items-center">
                <Loader2 className="mr-3 h-6 w-6 animate-spin text-amber-400" />
                {loadingSlow ? "El servidor esta tardando mas de lo esperado…" : "Cargando proyectos…"}
              </div>
              {loadingSlow && (
                <button
                  type="button"
                  onClick={() => void refetch()}
                  className="rounded-xl border border-white/15 bg-white/10 px-4 py-1.5 text-xs font-semibold text-white transition hover:bg-white/15"
                >
                  Reintentar
                </button>
              )}
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-4 px-6 py-16 text-center">
              <div className="rounded-full border border-dashed border-amber-500/35 bg-amber-500/[0.05] p-6">
                <FolderKanban className="mx-auto h-12 w-12 text-amber-300 opacity-85" aria-hidden />
              </div>
              <div>
                <p className="text-lg font-semibold text-white">Aún sin planos cargados para este lienzo.</p>
                <p className="mt-2 max-w-lg text-sm text-zinc-500">
                  Sembramos la API con tu tenant — si la cuadrícula sigue vacía, valida políticas IAM. Mientras llegan los proyectos puedes lanzar nuevos footprints.
                </p>
              </div>
              <Link
                href="/proyectos/new"
                className="rounded-2xl border border-amber-400/40 bg-amber-500/15 px-5 py-2.5 text-sm font-semibold text-amber-100 transition hover:bg-amber-500/25"
              >
                Nuevo proyecto
              </Link>
            </div>
          ) : (
            <table className="w-full min-w-[640px] text-left text-sm text-zinc-200">
              <thead>
                <tr className="border-b border-white/10 text-[10px] font-bold uppercase tracking-[0.18em] text-zinc-500">
                  <th className="px-3 py-3">Nombre</th>
                  <th className="px-3 py-3">Estado</th>
                  <th className="px-3 py-3">Tipo</th>
                  <th className="px-3 py-3 text-right">Presupuesto modelo</th>
                  <th className="px-3 py-3">Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row: Proyecto, idx: number) => (
                  <motion.tr
                    key={row.id || idx}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.04 * idx }}
                    className="border-b border-white/5 hover:bg-white/[0.03]"
                  >
                    <td className="px-3 py-3 font-medium text-white">
                      <Link href={`/proyectos/${encodeURIComponent(row.id)}`} className="hover:text-amber-200 underline-offset-2 hover:underline">
                        {displayProjectName(row)}
                      </Link>
                    </td>
                    <td className="px-3 py-3">
                      {row.state ? (
                        <StatusBadge status={proyectoStateBadgeStatus(row.state)} label={String(row.state)} size="sm" pulse={false} />
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3 font-mono text-[11px] text-zinc-400">{String(row.project_type ?? "—")}</td>
                    <td className="px-3 py-3 text-right font-mono text-emerald-200/90">{formatBudgetMillionsUsd(row)}</td>
                    <td className="px-3 py-3 text-xs text-zinc-500">{row.updated_at ?? row.created_at ?? "—"}</td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </GlassCard>
    </div>
  );
}
