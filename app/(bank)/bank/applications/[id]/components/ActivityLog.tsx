"use client";

import type { BankApplicationEvent } from "@/lib/bank-application-detail/types";

export interface ActivityLogProps {
  events: BankApplicationEvent[] | undefined;
  eventsCount: number | undefined;
}

function formatWhen(iso: string | undefined): string {
  if (!iso) return "—";
  try {
    return new Intl.DateTimeFormat("es-DO", { dateStyle: "short", timeStyle: "short" }).format(new Date(iso));
  } catch {
    return "—";
  }
}

export function ActivityLog({ events, eventsCount }: ActivityLogProps) {
  const rows = events?.length ? events : [];

  return (
    <section
      className="rounded-xl border border-forgeGray-200 bg-white p-6 shadow-sm"
      aria-labelledby="activity-section-title"
    >
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id="activity-section-title" className="text-lg font-semibold text-forgeGray-900">
          Actividad
        </h2>
        {eventsCount != null ? (
          <p className="text-forge-xs text-forgeGray-600">
            Total eventos: <span className="font-forgeMono">{eventsCount}</span>
          </p>
        ) : null}
      </div>
      <div className="mt-4 max-h-72 overflow-y-auto rounded-lg border border-forgeGray-100" role="log" aria-live="polite">
        {rows.length === 0 ? (
          <p className="p-4 text-forge-sm text-forgeGray-600">Sin eventos recientes.</p>
        ) : (
          <ul className="divide-y divide-forgeGray-100">
            {rows.map((ev, i) => (
              <li key={`${ev.at ?? ""}-${i}`} className="px-3 py-2">
                <p className="text-forge-xs text-forgeGray-500">{formatWhen(ev.at)}</p>
                <p className="text-forge-sm font-medium text-forgeGray-900">{ev.type ?? "evento"}</p>
                {(ev.summary || ev.message) && (
                  <p className="text-forge-sm text-forgeGray-700">{ev.summary ?? ev.message}</p>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
