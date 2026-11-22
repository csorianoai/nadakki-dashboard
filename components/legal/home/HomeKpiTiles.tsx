"use client";

import Link from "next/link";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useValidationQueue, useValidationQueueSummary } from "@/hooks/legal/useValidationQueue";
import { useHearingKpis } from "@/hooks/legal/useHearings";

type Props = { tenantId: string | undefined; casesTotal: number | null; casesLoading: boolean };

function Tile({ label, value, sub, tone, href, testId }: {
  label: string; value: string; sub?: string | null; tone?: "red" | "amber"; href?: string; testId: string;
}) {
  const color = tone === "red" ? "text-red-700 dark:text-red-400" : tone === "amber" ? "text-amber-700 dark:text-amber-400" : "text-slate-900 dark:text-zinc-100";
  const body = (
    <>
      <p className="text-xs font-medium text-slate-600 dark:text-zinc-400">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums tracking-tight ${color}`}>{value}</p>
      {sub ? <p className={`mt-0.5 text-xs ${tone ? color : "text-slate-500 dark:text-zinc-400"}`}>{sub}</p> : null}
    </>
  );
  const cls = "block rounded-xl border border-slate-200 bg-white px-4 py-3.5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900";
  return href ? (
    <Link href={href} data-testid={testId} className={`${cls} transition-colors hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:hover:border-blue-700`}>{body}</Link>
  ) : <div data-testid={testId} className={cls}>{body}</div>;
}

/**
 * Cuatro indicadores de "Mi despacho". Regla: "—" = no se sabe; un número solo si el
 * servidor lo confirma con cobertura completa. Los vencidos cuentan como urgentes.
 */
export function HomeKpiTiles({ tenantId, casesTotal, casesLoading }: Props) {
  const m = useLegalHomeMessages();
  const deadlines = useUpcomingDeadlines(tenantId, 7, false, true);
  const queue = useValidationQueue(tenantId);
  const summary = useValidationQueueSummary(tenantId);
  const hearings = useHearingKpis(tenantId);

  const lista = deadlines.data?.deadlines ?? null;
  // La cifra es "próximos 7 días"; los vencidos (de cualquier antigüedad) van aparte en la línea de abajo.
  const proximos = lista ? lista.filter((d) => d.overdue !== true) : null;
  const vencidos = lista ? lista.length - (proximos?.length ?? 0) : 0;
  const perentorios = proximos ? proximos.filter((d) => d.is_peremptory).length : 0;
  let plazosSub: string | null = null;
  let plazosTone: "red" | "amber" | undefined;
  if (vencidos > 0) {
    plazosSub = m.kpi_overdue.replace("{n}", String(vencidos));
    plazosTone = "red";
  } else if (perentorios > 0) {
    plazosSub = perentorios === 1 ? m.kpi_peremptory_one : m.kpi_peremptory_many.replace("{n}", String(perentorios));
    plazosTone = "red";
  } else if (lista && deadlines.data?.include_overdue == null) {
    plazosSub = m.kpi_overdue_unknown;
  }

  const s = summary.summary;
  const revisionesTotal = s ? s.total_open : queue.openCount;
  let revisionesSub: string | null = null;
  const partes: string[] = [];
  if (s && s.overdue > 0) partes.push(m.kpi_reviews_overdue.replace("{n}", String(s.overdue)));
  if (s && s.attorney_profile && s.assigned_to_me !== null) {
    partes.push(m.kpi_assigned_to_me.replace("{n}", String(s.assigned_to_me)));
  } else if (s && !s.attorney_profile) {
    partes.push(m.kpi_no_attorney_profile);
  } else if (queue.forbidden) {
    revisionesSub = m.kpi_pending_review_forbidden;
  } else if (queue.partial && revisionesTotal === null) {
    revisionesSub = m.kpi_partial;
  }
  if (partes.length) revisionesSub = partes.join(" · ");

  // KPI del servidor: solo audiencias programadas o confirmadas en los próximos 7 días.
  const audTotal = hearings.data && !hearings.data.demo_data ? hearings.data.upcoming_7d : null;
  const cargando = (b: boolean) => (b ? "…" : null);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="mi-despacho-kpis">
      <Tile
        testId="kpi-plazos"
        label={m.kpi_deadlines_7d}
        value={cargando(deadlines.isLoading) ?? (proximos ? String(proximos.length) : "—")}
        sub={deadlines.error ? m.kpi_unavailable : plazosSub}
        tone={plazosTone}
        href="#atencion-prioritaria"
      />
      <Tile
        testId="kpi-revisiones"
        label={m.kpi_pending_review}
        value={cargando(queue.loading && summary.loading) ?? (revisionesTotal === null ? "—" : String(revisionesTotal))}
        sub={revisionesSub}
        tone={s && s.overdue > 0 ? "amber" : undefined}
        href="#legal-reviews"
      />
      <Tile
        testId="kpi-audiencias"
        label={m.kpi_hearings_7d}
        value={cargando(hearings.isLoading) ?? (audTotal === null ? "—" : String(audTotal))}
        sub={hearings.error || hearings.data?.demo_data ? m.kpi_unavailable : null}
        href="/legal/audiencias"
      />
      <Tile
        testId="kpi-expedientes"
        label={m.kpi_cases_total}
        value={cargando(casesLoading) ?? (casesTotal === null ? "—" : String(casesTotal))}
        sub={casesTotal === null && !casesLoading ? m.kpi_unavailable : null}
        href="/legal/cases"
      />
    </div>
  );
}
