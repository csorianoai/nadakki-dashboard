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
          <li key={i} className="h-10 animate-pulse rounded-forge-sm bg-forgeSurface-sunken" />
        ))}
      </ul>
    );
  }

  if (!entries.length) {
    return <p className="text-forge-sm text-forge-text-muted">{m.recent_empty}</p>;
  }

  return (
    <ul className="divide-y divide-forgeInk-200 rounded-forge-md border border-forgeInk-200 bg-forgeSurface-card">
      {entries.map((e) => (
        <li key={e.request_id} className="flex flex-wrap items-baseline justify-between gap-2 px-4 py-3">
          <div>
            <p className="text-forge-sm font-medium text-forge-text">{e.agent_id}</p>
            <p className="text-xs text-forge-text-subtle">{e.request_id.slice(0, 8)}…</p>
          </div>
          <time className="text-xs tabular-nums text-forge-text-muted" dateTime={e.timestamp}>
            {formatAgo(e.timestamp)}
          </time>
        </li>
      ))}
    </ul>
  );
}
