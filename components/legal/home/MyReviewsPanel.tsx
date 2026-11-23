"use client";

import Link from "next/link";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useValidationQueue } from "@/hooks/legal/useValidationQueue";
import type { LegalCase } from "@/lib/legal/cases/case-types";

const MAX_ROWS = 5;

type Props = {
  tenantId: string | undefined;
  /** Expedientes ya cargados en el Inicio, para mostrar el título en vez del id. */
  cases: LegalCase[];
};

function formatDue(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleString("es-DO", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

/**
 * "Revisiones del bufete": la cola de validación del tenant (pending/assigned/in_review),
 * que puede incluir documentos asignados a otros abogados. No se llama "Mis revisiones"
 * mientras no se filtre por el abogado del usuario. Solo lectura; aprobar o rechazar se
 * hace dentro del expediente, en el flujo de revisión.
 */
export function MyReviewsPanel({ tenantId, cases }: Props) {
  const m = useLegalHomeMessages();
  const queue = useValidationQueue(tenantId);
  const byId = new Map(cases.map((c) => [c.case_id, c]));

  const statusLabel = (s: string) =>
    ({ pending: m.status_pending, assigned: m.status_assigned, in_review: m.status_in_review } as Record<string, string>)[s] ?? s;
  const priorityLabel = (p: string) =>
    ({ critical: m.priority_critical, high: m.priority_high, normal: m.priority_normal, low: m.priority_low } as Record<string, string>)[p] ?? p;

  let body: React.ReactNode;
  if (queue.loading) {
    body = <div className="h-16 animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800/60" aria-busy="true" />;
  } else if (queue.forbidden) {
    body = (
      <div className="space-y-2 text-sm text-slate-600 dark:text-zinc-400" data-testid="revisiones-sin-rol">
        <p>{m.reviews_forbidden}</p>
        <p>{m.reviews_forbidden_alt}</p>
        <Link href="/legal/cases" className="inline-flex rounded-md border border-slate-200 px-2.5 py-1 text-xs font-semibold text-blue-800 hover:border-blue-300 dark:border-zinc-700 dark:text-blue-300">{m.reviews_forbidden_cta}</Link>
      </div>
    );
  } else if (queue.error) {
    body = <p className="text-sm text-amber-700 dark:text-amber-400">{m.reviews_error}</p>;
  } else if (!queue.open.length) {
    body = <p className="text-sm text-slate-500 dark:text-zinc-400">{m.reviews_empty}</p>;
  } else {
    const rows = queue.open.slice(0, MAX_ROWS);
    const extra = queue.open.length - rows.length;
    body = (
      <>
        <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30">
          {rows.map((item) => {
            const c = byId.get(item.case_id);
            const due = formatDue(item.sla_deadline);
            const urgent = item.priority === "critical" || item.priority === "high";
            return (
              <li key={item.queue_item_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-900 dark:text-zinc-200">
                    {c ? c.title : m.reviews_case_fallback}
                    {c?.case_number_internal ? (
                      <span className="ml-2 text-xs font-normal text-zinc-500">{c.case_number_internal}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-zinc-400">
                    {statusLabel(item.status)}
                    {" · "}
                    <span className={urgent ? "text-amber-700 dark:text-amber-400" : undefined}>{priorityLabel(item.priority)}</span>
                    {item.sla_breached ? (
                      <span className="text-red-700 dark:text-red-400">{" · "}{m.reviews_overdue}</span>
                    ) : due ? (
                      <>{" · "}{m.reviews_due.replace("{date}", due)}</>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/legal/cases/${encodeURIComponent(item.case_id)}`}
                  className="shrink-0 rounded-lg border border-slate-200 px-3 py-1.5 dark:border-zinc-700 text-xs text-blue-700 hover:border-blue-300 hover:text-blue-900 dark:text-zinc-300 dark:hover:border-blue-600 dark:hover:text-zinc-100"
                >
                  {m.reviews_open_case}
                </Link>
              </li>
            );
          })}
        </ul>
        {extra > 0 ? <p className="mt-2 text-xs text-slate-500 dark:text-zinc-400">{m.reviews_more.replace("{n}", String(extra))}</p> : null}
        {queue.partial ? (
          <p className="mt-2 text-xs text-amber-800 dark:text-amber-300">
            {queue.openCount !== null
              ? m.reviews_partial.replace("{n}", String(queue.open.length))
              : m.reviews_partial_unknown}
          </p>
        ) : null}
      </>
    );
  }

  return (
    <section aria-labelledby="legal-reviews" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 id="legal-reviews" className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.reviews_title}</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-zinc-400">{m.reviews_subtitle}</p>
      <div className="mt-4">{body}</div>
    </section>
  );
}
