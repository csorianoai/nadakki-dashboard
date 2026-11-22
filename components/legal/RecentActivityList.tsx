"use client";

import Link from "next/link";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { legalResultLabel } from "@/lib/legal/legal-agent-labels";
import type { AuditTrailEntry } from "@/types/legal";

function formatAgo(iso: string): string {
  const t = new Date(iso).getTime();
  const d = Date.now() - t;
  const m = Math.floor(d / 60000);
  if (m < 1) return "hace instantes";
  if (m < 60) return `hace ${m} min`;
  const h = Math.floor(m / 60);
  if (h < 48) return `hace ${h} h`;
  return new Date(iso).toLocaleString("es-DO");
}

/** Detalle en lenguaje claro: citas y si requiere revisión. Sin hashes ni ids internos. */
function detailLine(e: AuditTrailEntry): string | null {
  const parts: string[] = [];
  const n = e.output_metadata?.citations_count;
  if (typeof n === "number") parts.push(n === 1 ? "1 cita" : `${n} citas`);
  const risk = String(e.output_metadata?.riesgo_legal ?? "").toLowerCase();
  if (risk === "high") parts.push("requiere revisión de abogado");
  if (e.status && e.status !== "success" && e.status !== "ok") parts.push("no completado");
  return parts.length ? parts.join(" · ") : null;
}

type Props = {
  entries: AuditTrailEntry[];
  loading: boolean;
};

export function RecentActivityList({ entries, loading }: Props) {
  const m = useLegalHomeMessages();

  if (loading) {
    return (
      <ul className="space-y-2" aria-busy="true">
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-10 animate-pulse rounded-lg bg-slate-100 dark:bg-zinc-800/50" />
        ))}
      </ul>
    );
  }

  if (!entries.length) {
    return <p className="text-sm text-slate-600 dark:text-zinc-400">{m.recent_empty}</p>;
  }

  return (
    <ul className="-my-2 divide-y divide-slate-100 dark:divide-zinc-800/50">
      {entries.map((e) => {
        const detail = detailLine(e);
        return (
          <li key={e.request_id} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-200">{legalResultLabel(e.agent_id)}</p>
              {detail ? <p className="text-xs text-slate-600 dark:text-zinc-400">{detail}</p> : null}
            </div>
            <time className="text-xs tabular-nums text-slate-500 dark:text-zinc-400" dateTime={e.timestamp}>
              {formatAgo(e.timestamp)}
            </time>
            {/* Retomar: el registro auditado guarda el resultado; el evento no trae expediente, así que se abre su traza. */}
            <Link
              href={`/legal/audit?request_id=${encodeURIComponent(e.request_id)}`}
              className="shrink-0 rounded-md border border-slate-200 px-2 py-1 text-xs font-semibold text-blue-800 hover:border-blue-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 dark:border-zinc-700 dark:text-blue-300"
            >
              Ver resultado<span className="sr-only"> de {legalResultLabel(e.agent_id)}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
