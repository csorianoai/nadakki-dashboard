"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useUpcomingDeadlines } from "@/hooks/legal/useUpcomingDeadlines";
import { useValidationQueue, useValidationQueueSummary } from "@/hooks/legal/useValidationQueue";
import { useHearingsList } from "@/hooks/legal/useHearings";

type Props = { tenantId: string | undefined; casesTotal: number | null; casesLoading: boolean };

/** Ventana [ahora, ahora + 7 días] redondeada al minuto (clave de caché estable). */
function semana(): { from: string; to: string } {
  const now = new Date();
  now.setSeconds(0, 0);
  return { from: now.toISOString(), to: new Date(now.getTime() + 7 * 86_400_000).toISOString() };
}

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
  const range = useMemo(semana, []);
  const hearings = useHearingsList(tenantId, { ...range, limit: 5 });

  const lista = deadlines.data?.deadlines ?? null;
  const vencidos = lista ? lista.filter((d) => d.overdue === true).length : 0;
  const perentorios = lista ? lista.filter((d) => d.is_peremptory).length : 0;
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
  if (s && s.attorney_profile && s.assigned_to_me !== null) {
    revisionesSub = m.kpi_assigned_to_me.replace("{n}", String(s.assigned_to_me));
  } else if (s && !s.attorney_profile) {
    revisionesSub = m.kpi_no_attorney_profile;
  } else if (queue.forbidden) {
    revisionesSub = m.kpi_pending_review_forbidden;
  } else if (queue.partial && revisionesTotal === null) {
    revisionesSub = m.kpi_partial;
  }

  const audTotal = hearings.data ? hearings.data.total : null;
  const cargando = (b: boolean) => (b ? "…" : null);

  return (
    <div className="grid grid-cols-2 gap-3 lg:grid-cols-4" data-testid="mi-despacho-kpis">
      <Tile
        testId="kpi-plazos"
        label={m.kpi_deadlines_7d}
        value={cargando(deadlines.isLoading) ?? (lista ? String(lista.length) : "—")}
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
        sub={hearings.error ? m.kpi_unavailable : null}
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
