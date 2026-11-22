"use client";

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
      <ul className="space-y-2" aria-busy>
        {[0, 1, 2, 3, 4].map((i) => (
          <li key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/50" />
        ))}
      </ul>
    );
  }

  if (!entries.length) {
    return <p className="text-sm text-zinc-500">{m.recent_empty}</p>;
  }

  return (
    <ul className="divide-y divide-zinc-800/50 overflow-hidden rounded-xl border border-zinc-800/50 bg-zinc-900/40">
      {entries.map((e) => {
        const detail = detailLine(e);
        return (
          <li key={e.request_id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
            <div>
              <p className="text-sm font-medium text-zinc-200">{legalResultLabel(e.agent_id)}</p>
              {detail ? <p className="text-xs text-zinc-500">{detail}</p> : null}
            </div>
            <time className="text-xs tabular-nums text-zinc-500" dateTime={e.timestamp}>
              {formatAgo(e.timestamp)}
            </time>
          </li>
        );
      })}
    </ul>
  );
}
