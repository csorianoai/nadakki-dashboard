"use client";

import Link from "next/link";
import { useContext } from "react";
import { Plus, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthContext as SesionContext } from "@/lib/auth/auth-context";
import { LegalStatusStrip } from "@/components/legal/LegalStatusStrip";
import { RecentActivityList } from "@/components/legal/RecentActivityList";
import { CaseWorkTable } from "@/components/legal/cases/CaseWorkTable";
import { MyReviewsPanel } from "@/components/legal/home/MyReviewsPanel";
import { UpcomingHearingsPanel } from "@/components/legal/home/UpcomingHearingsPanel";
import { HomeKpiTiles } from "@/components/legal/home/HomeKpiTiles";
import { PriorityDeadlinesPanel } from "@/components/legal/home/PriorityDeadlinesPanel";
import { QuickAiActions } from "@/components/legal/home/QuickAiActions";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useLegalTasks } from "@/hooks/useLegalTasks";
import { useLegalRecentActivity } from "@/hooks/useLegalRecentActivity";
import { useLegalEffectiveTenantId } from "@/hooks/useLegalCore";
import { useLegalCases } from "@/hooks/legal/useLegalCases";
import { useTrabajoExpedientes } from "@/hooks/legal/useTrabajoExpedientes";

const MAX_EXPEDIENTES = 5;

/** Nombre de la institución: el del tenant de la sesión (el mismo de la barra superior); «—» solo si no hay ninguno. */
export function nombreInstitucion(sesion: string | null | undefined, guardado: string | null | undefined): string | null {
  for (const n of [sesion, guardado]) {
    const t = (n ?? "").trim();
    if (t && t !== "—") return t;
  }
  return null;
}

function hoyLargo(): string {
  const s = new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long" });
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Inicio legal «Mi despacho» (NADAKKI Legal OS, referencia Clio). Orden aprobado por César (22-nov):
 * encabezado y acciones → atención prioritaria → indicadores → mis expedientes recientes → revisiones y
 * audiencias → acciones rápidas de IA → actividad reciente. El catálogo completo de IA vive en /legal/asistente
 * y la navegación solo en el menú lateral.
 */
export default function LegalHomeContent() {
  const m = useLegalHomeMessages();
  const auth = useAuth();
  const sesion = useContext(SesionContext);
  const { effectiveTenantId } = useLegalEffectiveTenantId();
  const { tasks, loading, error, refetch } = useLegalTasks("do");
  const recent = useLegalRecentActivity(effectiveTenantId, 5);
  const casesQ = useLegalCases(effectiveTenantId);
  const casos = casesQ.data?.cases ?? [];
  const trabajo = useTrabajoExpedientes(effectiveTenantId, casos);
  const filas = [...trabajo.filas]
    .sort((a, b) => String(b.caso.updated_at).localeCompare(String(a.caso.updated_at)))
    .slice(0, MAX_EXPEDIENTES);

  const institucion = nombreInstitucion(sesion?.tenant?.display_name, auth.tenantName);
  const showAdmin = auth.role === "admin" || auth.role === "owner";

  return (
    <div id="main-content" className="mx-auto flex w-full min-w-0 max-w-[1600px] flex-col gap-4 pb-24">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.title}</h1>
          <p className="mt-0.5 text-sm text-slate-600 dark:text-zinc-400">
            {hoyLargo()}
            {institucion ? <> · <span className="font-medium text-slate-800 dark:text-zinc-200" data-testid="institucion">{institucion}</span></> : null}
            {showAdmin ? <span className="ml-2 rounded border border-slate-200 px-1.5 py-0.5 text-[11px] text-slate-500 dark:border-zinc-700 dark:text-zinc-400">{m.admin_badge}</span> : null}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link href="/legal/asistente" className="inline-flex items-center gap-1.5 rounded-lg border border-blue-200 bg-white px-3 py-2 text-sm font-semibold text-blue-800 hover:bg-blue-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-blue-800 dark:bg-transparent dark:text-blue-300">
            <Sparkles className="h-4 w-4" aria-hidden />Asistente IA
          </Link>
          <Link href="/legal/cases/new" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-700 px-3.5 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            <Plus className="h-4 w-4" aria-hidden />{m.new_case_cta}
          </Link>
        </div>
      </header>

      <PriorityDeadlinesPanel tenantId={effectiveTenantId} />

      <HomeKpiTiles
        tenantId={effectiveTenantId}
        casesTotal={typeof casesQ.data?.total === "number" ? casesQ.data.total : null}
        casesLoading={casesQ.isLoading}
      />

      <section aria-labelledby="legal-active-cases" className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
          <h2 id="legal-active-cases" className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100">Mis expedientes recientes</h2>
          <Link href="/legal/cases" className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">Ver todos</Link>
        </div>
        {casesQ.isLoading ? (
          <div aria-busy="true" className="space-y-2 p-4">{[0, 1, 2].map((i) => <div key={i} className="h-9 animate-pulse rounded bg-slate-100 dark:bg-zinc-800" />)}</div>
        ) : casesQ.error ? (
          <p className="px-4 py-5 text-sm text-amber-800 dark:text-amber-300">No se pudieron cargar los expedientes.</p>
        ) : filas.length === 0 ? (
          <p className="px-4 py-5 text-sm text-slate-500 dark:text-zinc-400">No hay expedientes abiertos. <Link href="/legal/cases/new" className="font-semibold text-blue-700 underline dark:text-blue-300">Crear el primero</Link></p>
        ) : (
          <CaseWorkTable filas={filas} plazosDisponibles={trabajo.plazosDisponibles} revisionesDisponibles={trabajo.revisionesDisponibles} titulo="Mis expedientes recientes" />
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2 [&>*]:min-w-0">
        <MyReviewsPanel tenantId={effectiveTenantId} cases={casos} />
        <UpcomingHearingsPanel tenantId={effectiveTenantId} />
      </div>

      <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr] [&>*]:min-w-0">
        <QuickAiActions tasks={tasks} loading={loading} error={Boolean(error)} onRetry={() => void refetch()} />
        <section aria-labelledby="legal-recent" className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 dark:border-zinc-800">
            <h2 id="legal-recent" className="text-[15px] font-semibold text-slate-900 dark:text-zinc-100">{m.recent_activity}</h2>
            <Link href="/legal/audit" className="text-xs font-semibold text-blue-700 hover:underline dark:text-blue-300">Ver auditoría</Link>
          </div>
          <div className="p-4">
            <RecentActivityList entries={recent.entries} loading={recent.loading} />
          </div>
        </section>
      </div>

      <LegalStatusStrip tenantId={effectiveTenantId} />
    </div>
  );
}
