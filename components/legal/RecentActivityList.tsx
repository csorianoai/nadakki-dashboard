"use client";

import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
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
      {entries.map((e) => (
        <li key={e.request_id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-sm font-medium text-zinc-200">{e.agent_id}</p>
            <p className="text-xs tabular-nums text-zinc-500">{e.request_id.slice(0, 8)}…</p>
          </div>
          <time className="text-xs tabular-nums text-zinc-500" dateTime={e.timestamp}>
            {formatAgo(e.timestamp)}
          </time>
        </li>
      ))}
    </ul>
  );
}
