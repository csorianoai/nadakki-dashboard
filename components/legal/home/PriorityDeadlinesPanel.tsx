"use client";

import Link from "next/link";
import { AlertTriangle, CalendarClock } from "lucide-react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useUpcomingDeadlines, type UpcomingDeadline } from "@/hooks/legal/useUpcomingDeadlines";

const MAX_ROWS = 6;

/** Fecha de plazo (DATE del backend, "AAAA-MM-DD") mostrada sin desplazarla por zona horaria. */
export function formatDeadlineDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  if (!m) return "—";
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 12));
  return d.toLocaleDateString("es-DO", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });
}

/** Vencidos primero, luego perentorios, luego por fecha. */
export function sortDeadlines(list: UpcomingDeadline[]): UpcomingDeadline[] {
  return [...list].sort((a, b) => {
    if (Boolean(a.overdue) !== Boolean(b.overdue)) return a.overdue ? -1 : 1;
    if (a.is_peremptory !== b.is_peremptory) return a.is_peremptory ? -1 : 1;
    return String(a.effective_deadline_date).localeCompare(String(b.effective_deadline_date));
  });
}

function Tag({ children, tone }: { children: React.ReactNode; tone?: "red" | "amber" | "blue" }) {
  const c = tone === "red" ? "bg-red-50 text-red-800 dark:bg-red-950/40 dark:text-red-300"
    : tone === "amber" ? "bg-amber-50 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300"
    : "bg-blue-50 text-blue-800 dark:bg-blue-950/40 dark:text-blue-300";
  return <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[11px] font-semibold ${c}`}>{children}</span>;
}

/**
 * "Atención prioritaria": plazos procesales de los próximos 7 días y los vencidos sin acusar.
 * Muestra la fecha efectiva, el fundamento legal, si es perentorio, si hay override humano y si
 * la regla del catálogo está validada. No recalcula nada: la fuente es /deadlines/upcoming.
 */
export function PriorityDeadlinesPanel({ tenantId }: { tenantId: string | undefined }) {
  const m = useLegalHomeMessages();
  const q = useUpcomingDeadlines(tenantId, 7, false, true);
  const lista = q.data ? sortDeadlines(q.data.deadlines) : [];
  const vencidosConfirmados = q.data?.include_overdue === true;

  let body: React.ReactNode;
  if (q.isLoading) {
    body = <div className="h-20 animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800/60" aria-busy="true" />;
  } else if (q.error) {
    body = <p className="text-sm text-amber-800 dark:text-amber-300">{m.priority_error}</p>;
  } else if (!lista.length) {
    body = (
      <p className="text-sm text-slate-600 dark:text-zinc-400">
        {vencidosConfirmados ? m.priority_empty : m.priority_empty_no_overdue}
      </p>
    );
  } else {
    const filas = lista.slice(0, MAX_ROWS);
    body = (
      <>
        <ul className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filas.map((d) => (
            <li key={d.deadline_id} className="flex flex-wrap items-start gap-x-3 gap-y-2 py-3 first:pt-0 last:pb-0 sm:flex-nowrap">
              <span className={`mt-0.5 ${d.overdue ? "text-red-600 dark:text-red-400" : "text-slate-400 dark:text-zinc-500"}`} aria-hidden>
                {d.overdue ? <AlertTriangle className="h-4 w-4" /> : <CalendarClock className="h-4 w-4" />}
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-slate-900 dark:text-zinc-100">
                  {d.deadline_sub_category || d.deadline_category || m.priority_deadline_fallback}
                  <span className="font-normal text-slate-600 dark:text-zinc-400">{" — "}{d.case_title || d.case_number_internal || m.reviews_case_fallback}</span>
                </p>
                <p className="mt-0.5 text-xs text-slate-600 dark:text-zinc-400">
                  {d.overdue ? m.priority_overdue_on : m.priority_due_on} {formatDeadlineDate(d.effective_deadline_date)}
                  {d.legal_basis ? <>{" · "}{d.legal_basis}</> : null}
                </p>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {d.overdue ? <Tag tone="red">{m.priority_tag_overdue}</Tag> : null}
                  {d.is_peremptory ? <Tag tone="red">{m.priority_tag_peremptory}</Tag> : null}
                  {d.has_human_override ? <Tag tone="blue">{m.priority_tag_override}</Tag> : null}
                  {d.catalog_validated === true ? null : <Tag tone="amber">{m.priority_tag_unverified}</Tag>}
                </div>
              </div>
              <Link
                href={`/legal/cases/${encodeURIComponent(d.case_id)}/deadlines`}
                className="ml-7 shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 sm:ml-0 text-xs font-medium text-blue-700 hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:text-blue-300"
                aria-label={`${m.priority_open} — ${d.case_title || d.case_number_internal || m.reviews_case_fallback}`}
              >
                {m.priority_open}
              </Link>
            </li>
          ))}
        </ul>
        {lista.length > filas.length ? (
          <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{m.reviews_more.replace("{n}", String(lista.length - filas.length))}</p>
        ) : null}
      </>
    );
  }

  return (
    <section id="atencion-prioritaria" aria-labelledby="legal-priority" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="legal-priority" className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.priority_title}</h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-zinc-400">{m.priority_subtitle}</p>
      <div className="mt-4">{body}</div>
    </section>
  );
}
