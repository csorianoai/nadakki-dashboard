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
 * "Mis revisiones": documentos en la cola de validación (pending/assigned/in_review).
 * Solo lectura; aprobar o rechazar se hace dentro del expediente.
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
    body = <div className="h-16 animate-pulse rounded-lg bg-zinc-800/50" aria-busy />;
  } else if (queue.forbidden) {
    body = <p className="text-sm text-zinc-500">{m.reviews_forbidden}</p>;
  } else if (queue.error) {
    body = <p className="text-sm text-amber-400">{m.reviews_error}</p>;
  } else if (!queue.open.length) {
    body = <p className="text-sm text-zinc-500">{m.reviews_empty}</p>;
  } else {
    const rows = queue.open.slice(0, MAX_ROWS);
    const extra = queue.open.length - rows.length;
    body = (
      <>
        <ul className="divide-y divide-zinc-800/50 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40">
          {rows.map((item) => {
            const c = byId.get(item.case_id);
            const due = formatDue(item.sla_deadline);
            const urgent = item.priority === "critical" || item.priority === "high";
            return (
              <li key={item.queue_item_id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-zinc-200">
                    {c ? c.title : m.reviews_case_fallback}
                    {c?.case_number_internal ? (
                      <span className="ml-2 text-xs font-normal text-zinc-500">{c.case_number_internal}</span>
                    ) : null}
                  </p>
                  <p className="text-xs text-zinc-500">
                    {statusLabel(item.status)}
                    {" · "}
                    <span className={urgent ? "text-amber-400" : undefined}>{priorityLabel(item.priority)}</span>
                    {item.sla_breached ? (
                      <span className="text-red-400">{" · "}{m.reviews_overdue}</span>
                    ) : due ? (
                      <>{" · "}{m.reviews_due.replace("{date}", due)}</>
                    ) : null}
                  </p>
                </div>
                <Link
                  href={`/legal/cases/${encodeURIComponent(item.case_id)}`}
                  className="shrink-0 rounded-lg border border-zinc-700 px-3 py-1.5 text-xs text-zinc-300 hover:border-violet-500/50 hover:text-zinc-100"
                >
                  {m.reviews_open_case}
                </Link>
              </li>
            );
          })}
        </ul>
        {extra > 0 ? <p className="mt-2 text-xs text-zinc-500">{m.reviews_more.replace("{n}", String(extra))}</p> : null}
      </>
    );
  }

  return (
    <section aria-labelledby="legal-reviews" className="rounded-2xl border border-zinc-800/50 bg-zinc-900/20 p-6">
      <h2 id="legal-reviews" className="text-base font-medium tracking-tight text-zinc-100">{m.reviews_title}</h2>
      <p className="mt-1 text-sm text-zinc-500">{m.reviews_subtitle}</p>
      <div className="mt-4">{body}</div>
    </section>
  );
}
