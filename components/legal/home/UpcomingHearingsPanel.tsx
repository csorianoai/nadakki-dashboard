"use client";

import Link from "next/link";
import { useMemo } from "react";
import { useLegalHomeMessages } from "@/hooks/useLegalHomeMessages";
import { useHearingsList } from "@/hooks/legal/useHearings";

const HORIZON_DAYS = 7;

type Props = { tenantId: string | undefined };

/** Ventana fija [ahora, ahora + 7 días] redondeada al minuto para que la clave de caché sea estable. */
function windowIso(): { from: string; to: string } {
  const now = new Date();
  now.setSeconds(0, 0);
  const to = new Date(now.getTime() + HORIZON_DAYS * 24 * 60 * 60 * 1000);
  return { from: now.toISOString(), to: to.toISOString() };
}

export function UpcomingHearingsPanel({ tenantId }: Props) {
  const m = useLegalHomeMessages();
  const range = useMemo(windowIso, []);
  const q = useHearingsList(tenantId, { ...range, limit: 5 });

  const hearings = [...(q.data?.hearings ?? [])].sort((a, b) => a.hearing_date.localeCompare(b.hearing_date));

  let body: React.ReactNode;
  if (q.isLoading) {
    body = <div className="h-16 animate-pulse rounded-lg bg-zinc-800/50" aria-busy />;
  } else if (q.error) {
    body = <p className="text-sm text-amber-700 dark:text-amber-400">{m.hearings_error}</p>;
  } else if (!hearings.length) {
    body = <p className="text-sm text-slate-500 dark:text-zinc-400">{m.hearings_empty}</p>;
  } else {
    body = (
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100 bg-white dark:divide-zinc-800 dark:border-zinc-800 dark:bg-zinc-950/30">
        {hearings.map((h) => {
          const when = new Date(h.hearing_date).toLocaleString("es-DO", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          });
          const place = [h.courtroom, h.location].filter(Boolean).join(" · ");
          const inner = (
            <>
              <p className="text-sm font-medium text-slate-900 dark:text-zinc-200">{h.title}</p>
              <p className="text-xs text-slate-500 dark:text-zinc-400">
                <time dateTime={h.hearing_date}>{when}</time>
                {place ? ` · ${place}` : ""}
              </p>
            </>
          );
          return (
            <li key={h.id} className="px-4 py-3">
              {h.case_id ? (
                <Link href={`/legal/cases/${encodeURIComponent(h.case_id)}`} className="block hover:opacity-90">
                  {inner}
                </Link>
              ) : (
                inner
              )}
            </li>
          );
        })}
      </ul>
    );
  }

  return (
    <section aria-labelledby="legal-hearings" className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="legal-hearings" className="text-base font-semibold tracking-tight text-slate-900 dark:text-zinc-100">{m.hearings_title}</h2>
        <Link href="/legal/audiencias" className="text-xs font-medium text-blue-700 hover:text-blue-900 dark:text-blue-300 dark:hover:text-blue-200">
          {m.hearings_all}
        </Link>
      </div>
      <div className="mt-4">{body}</div>
    </section>
  );
}
